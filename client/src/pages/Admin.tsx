import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Trash2, ImagePlus, ArrowLeft, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SelectBuild } from "@db/schema";

interface FormInputs {
  name: string;
  description: string;
  price: string;
  customPrice?: string;
}

const PRESET_PRICES = [
  { value: "2.99", label: "$2.99" },
  { value: "4.99", label: "$4.99" },
  { value: "7.99", label: "$7.99" },
  { value: "9.99", label: "$9.99" },
  { value: "15.99", label: "$15.99" },
  { value: "custom", label: "Custom Price" },
];

export default function Admin() {
  const { user } = useUser();
  const [, setLocation] = useLocation();

  // If user is not logged in, show auth required message
  if (!user) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h1 className="text-2xl font-bold">Authentication Required</h1>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Please sign in to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If user is not BunnyMC5406, show unauthorized message
  if (user.username !== "BunnyMC5406") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <h1 className="text-2xl font-bold">Unauthorized Access</h1>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              You do not have permission to access this page. This area is restricted to administrators only.
            </p>
            <Button 
              className="mt-4 w-full"
              onClick={() => setLocation('/')}
            >
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showCustomPrice, setShowCustomPrice] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormInputs>();

  const { data: builds = [] } = useQuery<SelectBuild[]>({
    queryKey: ['/api/builds'],
  });

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Error",
        description: "Please drop an image file",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const createBuildMutation = useMutation({
    mutationFn: async (data: FormInputs) => {
      if (!imageFile) {
        throw new Error("Please select an image");
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(imageFile);
      });

      const finalPrice = data.price === "custom"
        ? parseFloat(data.customPrice || "0")
        : parseFloat(data.price);

      if (isNaN(finalPrice) || finalPrice <= 0) {
        throw new Error("Please enter a valid price");
      }

      const response = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          price: Math.round(finalPrice * 100),
          image: base64
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create build');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/builds'] });
      toast({
        title: "Success",
        description: "Build created successfully"
      });
      setImageFile(null);
      setImagePreview(null);
      setShowCustomPrice(false);
      setLocation('/');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create build",
        variant: "destructive"
      });
    }
  });

  const deleteBuildMutation = useMutation({
    mutationFn: async (buildId: number) => {
      const response = await fetch(`/api/builds/${buildId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete build');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/builds'] });
      toast({
        title: "Success",
        description: "Build deleted successfully"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete build",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: FormInputs) => {
    try {
      await createBuildMutation.mutateAsync(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Build</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Input
                  placeholder="Build Name"
                  {...register("name", { required: "Name is required" })}
                  className="w-full"
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                )}
              </div>
              <div>
                <Textarea
                  placeholder="Description"
                  {...register("description", { required: "Description is required" })}
                  className="min-h-[100px] w-full"
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Select
                  onValueChange={(value) => {
                    setValue("price", value);
                    setShowCustomPrice(value === "custom");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Price" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_PRICES.map((price) => (
                      <SelectItem key={price.value} value={price.value}>
                        {price.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showCustomPrice && (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter custom price"
                    className="w-full"
                    {...register("customPrice", {
                      required: showCustomPrice,
                      min: { value: 0.01, message: "Price must be greater than 0" }
                    })}
                  />
                )}
                {errors.customPrice && (
                  <p className="text-sm text-destructive mt-1">{errors.customPrice.message}</p>
                )}
              </div>
              <div
                className={`space-y-2 border-2 border-dashed rounded-lg p-4 transition-colors ${
                  isDragging ? 'border-primary bg-primary/10' : 'border-border'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <ImagePlus className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground text-center">
                    Drag and drop an image here, or click to select
                  </p>
                </label>
                {!imageFile && !imagePreview && (
                  <p className="text-sm text-destructive mt-1">Please select an image</p>
                )}
                {imagePreview && (
                  <div className="aspect-video relative overflow-hidden rounded-lg border mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={createBuildMutation.isPending || !imageFile}
                className="w-full"
              >
                {createBuildMutation.isPending ? "Creating..." : "Create Build"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Builds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {builds.map((build) => (
                <div key={build.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 flex-shrink-0 relative rounded overflow-hidden">
                      <img
                        src={build.image}
                        alt={build.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold">{build.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ${(build.price / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteBuildMutation.mutate(build.id)}
                    disabled={deleteBuildMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {builds.length === 0 && (
                <p className="text-center text-muted-foreground">No builds yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}