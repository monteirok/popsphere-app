import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { insertCollectibleSchema } from "@shared/schema";

// Extend the schema with validation rules
const addItemSchema = insertCollectibleSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  series: z.string().min(1, "Series is required"),
  variant: z.string().min(1, "Variant is required"),
  rarity: z.string().min(1, "Rarity is required"),
  image: z.string().url("Must be a valid URL"),
  description: z.string().optional(),
});

// Define the series options
const seriesOptions = [
  "Dimoo",
  "Molly",
  "Skullpanda",
  "Labubu",
  "Bunny",
  "Pucky",
  "Other"
];

// Define the rarity options
const rarityOptions = [
  { value: "common", label: "Common" },
  { value: "rare", label: "Rare" },
  { value: "ultra-rare", label: "Ultra Rare" },
  { value: "limited", label: "Limited Edition" },
];

interface AddItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddItemModal({ open, onOpenChange, onSuccess }: AddItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  
  // Set up the form
  const form = useForm<z.infer<typeof addItemSchema>>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      name: "",
      series: "",
      variant: "",
      rarity: "common",
      image: "",
      description: "",
      forTrade: false,
      userId: 0, // Will be set by the server
    },
  });
  
  // Set up the mutation
  const { mutate } = useMutation({
    mutationFn: async (values: z.infer<typeof addItemSchema>) => {
      setIsSubmitting(true);
      const response = await apiRequest("POST", "/api/collectibles", values);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collectibles"] });
      form.reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("Error adding item:", error);
      setIsSubmitting(false);
    },
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof addItemSchema>) => {
    mutate(values);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl text-pop-pink dark:text-brand-dark">Add New Collectible</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Dimoo Candy Series" className="dark:bg-gray-700 dark:border-gray-600" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="variant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Variant</FormLabel>
                    <FormControl>
                      <Input placeholder="Strawberry Dream" className="dark:bg-gray-700 dark:border-gray-600" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="series"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Series</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                          <SelectValue placeholder="Select a series" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {seriesOptions.map((series) => (
                          <SelectItem key={series} value={series}>
                            {series}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rarity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rarity</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                          <SelectValue placeholder="Select rarity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                        {rarityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" className="dark:bg-gray-700 dark:border-gray-600" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="A cute pink Dimoo with strawberry theme" 
                          className="resize-none dark:bg-gray-700 dark:border-gray-600" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="forTrade"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border dark:border-gray-600 p-4 dark:bg-gray-700/30">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="dark:border-gray-500"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Available for Trade</FormLabel>
                        <p className="text-sm text-muted-foreground dark:text-gray-400">
                          Make this collectible available for trading with other collectors
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="dark:border-gray-600 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-pop-pink dark:bg-brand-dark hover:bg-opacity-90"
              >
                {isSubmitting ? "Adding..." : "Add to Collection"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
