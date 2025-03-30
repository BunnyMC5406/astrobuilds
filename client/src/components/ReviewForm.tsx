import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import StarRating from "./StarRating";
import { useUser } from "@/hooks/use-user";
import type { SelectReview } from "@db/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const reviewSchema = z.object({
  rating: z.number().min(1, "Please select a rating"),
  comment: z.string().min(1, "Review comment is required"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  buildId: number;
  onSuccess?: () => void;
}

export default function ReviewForm({ buildId, onSuccess }: ReviewFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  // Check if user has already reviewed this build
  const { data: reviews = [] } = useQuery<SelectReview[]>({
    queryKey: [`/api/builds/${buildId}/reviews`],
  });

  const hasReviewed = user && reviews.some(
    (review) => review.userName === user.username
  );

  // If user is not logged in or has already reviewed, show appropriate message
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Please sign in to write a review.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (hasReviewed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You have already reviewed this build.
          </p>
        </CardContent>
      </Card>
    );
  }

  async function onSubmit(data: ReviewFormData) {
    if (!user) return;

    try {
      const response = await fetch(`/api/builds/${buildId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          userName: user.username
        }),
      });

      if (!response.ok) throw new Error("Failed to submit review");

      toast({
        title: "Success",
        description: "Your review has been submitted",
      });

      form.reset({
        rating: 0,
        comment: "",
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review",
        variant: "destructive",
      });
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Rating</FormLabel>
                  <FormControl>
                    <div className="py-2">
                      <StarRating
                        rating={field.value}
                        onChange={field.onChange}
                        disabled={form.formState.isSubmitting}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Review</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Share your thoughts about this build..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              disabled={form.formState.isSubmitting}
              className="w-full sm:w-auto"
            >
              Submit Review
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}