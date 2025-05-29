import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArtistSettingsFormValues } from "@/hooks/use-artist-settings";
import { artistSettingsSchema } from "@/lib/validations/artist-settings";

interface ArtistProfileFormProps {
  defaultValues: Partial<ArtistSettingsFormValues>;
  onSubmit: (data: ArtistSettingsFormValues) => void;
  isSubmitting: boolean;
}

export function ArtistProfileForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: ArtistProfileFormProps) {
  const form = useForm<ArtistSettingsFormValues>({
    resolver: zodResolver(artistSettingsSchema),
    defaultValues: defaultValues || {
      name: "",
      email: "",
      phone: "",
      address: "",
      image: "",
      bio: "",
      experience_years: "",
      portfolio: "",
      gender: "",
      pricing: undefined,
      availability: false,
      services: [],
    },
    mode: "onChange",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => {
              const modifiedField = {
                ...field,
                value: field.value ?? "",
              };
              return (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...modifiedField} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => {
              const modifiedField = {
                ...field,
                value: field.value ?? "",
              };
              return (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Your email" {...modifiedField} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => {
              const modifiedField = {
                ...field,
                value: field.value ?? "",
              };
              return (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Your phone number" {...modifiedField} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="experience_years"
            render={({ field }) => {
              const modifiedField = {
                ...field,
                value: field.value ?? "",
              };
              return (
                <FormItem>
                  <FormLabel>Years of Experience</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 5 years" {...modifiedField} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => {
            const modifiedField = {
              ...field,
              value: field.value ?? "",
            };
            return (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Your address" {...modifiedField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => {
            const modifiedField = {
              ...field,
              value: field.value ?? "",
            };
            return (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell clients about yourself"
                    className="resize-none h-32"
                    {...modifiedField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => {
              const modifiedField = {
                ...field,
                value: field.value ?? "",
              };
              return (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <Input placeholder="Your gender" {...modifiedField} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          <FormField
            control={form.control}
            name="pricing"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Pricing</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Your default service price"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value =
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="portfolio"
          render={({ field }) => {
            const modifiedField = {
              ...field,
              value: field.value ?? "",
            };
            return (
              <FormItem>
                <FormLabel>Portfolio URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Link to your portfolio"
                    {...modifiedField}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <Button
          type="submit"
          className="w-full md:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Profile
        </Button>
      </form>
    </Form>
  );
}
