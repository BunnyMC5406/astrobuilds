import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, roles, userRoles, insertUserSchema, type SelectUser } from "@db/schema";
import { db } from "@db";
import { eq, and } from "drizzle-orm";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

// extend express user object with our schema
declare global {
  namespace Express {
    interface User extends SelectUser { }
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "porygon-supremacy",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const { username, password, email, bio } = result.data;

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(
          email ? 
            and(
              eq(users.username, username),
              eq(users.email, email)
            ) : 
            eq(users.username, username)
        )
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Username or email already exists");
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);

      // Create the new user
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          email,
          bio,
        })
        .returning();

      // Log the user in after registration
      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          message: "Registration successful",
          user: { 
            id: newUser.id, 
            username: newUser.username,
            email: newUser.email,
            bio: newUser.bio
          },
        });
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    const result = insertUserSchema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
    }

    const cb = (err: any, user: Express.User | false, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).send(info.message ?? "Login failed");
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }

        return res.json({
          message: "Login successful",
          user: { 
            id: user.id, 
            username: user.username,
            email: user.email,
            bio: user.bio
          },
        });
      });
    };
    passport.authenticate("local", cb)(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }

      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", async (req, res) => {
    if (req.isAuthenticated()) {
      const userRolesList = await db
        .select({
          roleName: roles.name
        })
        .from(userRoles)
        .innerJoin(roles, eq(roles.id, userRoles.roleId))
        .where(eq(userRoles.userId, req.user.id));

      const userWithRoles = {
        ...req.user,
        roles: userRolesList.map(r => r.roleName)
      };

      return res.json(userWithRoles);
    }

    res.status(401).send("Not logged in");
  });

  // Admin-only route to assign roles
  app.post("/api/user/:userId/roles", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    // Check if the current user is an admin
    const [adminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "admin"))
      .limit(1);

    if (!adminRole) {
      return res.status(404).send("Admin role not found");
    }

    const [userHasAdminRole] = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, req.user.id),
          eq(userRoles.roleId, adminRole.id)
        )
      )
      .limit(1);

    if (!userHasAdminRole) {
      return res.status(403).send("Insufficient permissions");
    }

    const { roleNames } = req.body;
    const userId = parseInt(req.params.userId);

    try {
      // First, remove all existing roles for the user
      await db
        .delete(userRoles)
        .where(eq(userRoles.userId, userId));

      // Get all requested roles
      const availableRoles = await db
        .select()
        .from(roles)
        .where(eq(roles.name, roleNames[0]));

      // Assign new roles
      if (availableRoles.length > 0) {
        await db.insert(userRoles)
          .values(
            availableRoles.map(role => ({
              userId,
              roleId: role.id
            }))
          );
      }

      res.json({ message: "Roles updated successfully" });
    } catch (error) {
      res.status(500).send("Failed to update roles");
    }
  });
}