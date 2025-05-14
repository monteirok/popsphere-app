import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";

const registerSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must not exceed 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  displayName: z.string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must not exceed 50 characters"),
  email: z.string()
    .email("Invalid email address"),
  password: z.string()
    .min(6, "Password must be at least 6 characters"),
  profileImage: z.string().url("Must be a valid URL").optional(),
  bio: z.string().max(160, "Bio must not exceed 160 characters").optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const { register, isRegisterPending } = useAuth();
  
  // Set up the form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      displayName: "",
      email: "",
      password: "",
      profileImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
      bio: "",
    },
  });
  
  const onSubmit = (values: RegisterFormValues) => {
    register(values);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="profileImage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Image URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/avatar.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about yourself and your collection"
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full bg-pop-pink hover:bg-opacity-90"
          disabled={isRegisterPending}
        >
          {isRegisterPending ? "Creating Account..." : "Create Account"}
        </Button>
        
        <div className="text-center text-xs text-gray-500 mt-4">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </div>
      </form>
    </Form>
  );
}
}
