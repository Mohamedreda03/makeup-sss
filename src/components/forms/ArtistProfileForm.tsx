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
      instagram_url: "",
      facebook_url: "",
      twitter_url: "",
      tiktok_url: "",
      youtube_url: "",
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
        </div>{" "}
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
        {/* Social Media Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Social Media Links</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="instagram_url"
              render={({ field }) => {
                const modifiedField = {
                  ...field,
                  value: field.value ?? "",
                };
                return (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://instagram.com/username"
                        {...modifiedField}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="facebook_url"
              render={({ field }) => {
                const modifiedField = {
                  ...field,
                  value: field.value ?? "",
                };
                return (
                  <FormItem>
                    <FormLabel>Facebook</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://facebook.com/username"
                        {...modifiedField}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="twitter_url"
              render={({ field }) => {
                const modifiedField = {
                  ...field,
                  value: field.value ?? "",
                };
                return (
                  <FormItem>
                    <FormLabel>Twitter</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://twitter.com/username"
                        {...modifiedField}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="tiktok_url"
              render={({ field }) => {
                const modifiedField = {
                  ...field,
                  value: field.value ?? "",
                };
                return (
                  <FormItem>
                    <FormLabel>TikTok</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://tiktok.com/@username"
                        {...modifiedField}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="youtube_url"
              render={({ field }) => {
                const modifiedField = {
                  ...field,
                  value: field.value ?? "",
                };
                return (
                  <FormItem>
                    <FormLabel>YouTube</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://youtube.com/channel/..."
                        {...modifiedField}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>
        </div>
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
