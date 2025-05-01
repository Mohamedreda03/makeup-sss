import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface SocialMediaFormProps {
  defaultValues: Partial<ArtistSettingsFormValues>;
  onSubmit: (data: ArtistSettingsFormValues) => void;
  isSubmitting: boolean;
}

export function SocialMediaForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: SocialMediaFormProps) {
  const form = useForm<ArtistSettingsFormValues>({
    resolver: zodResolver(artistSettingsSchema),
    defaultValues: defaultValues || {
      name: "",
      email: "",
      yearsOfExperience: undefined,
      bio: "",
      instagram: "",
      facebook: "",
      twitter: "",
      tiktok: "",
      website: "",
      defaultPrice: undefined,
      category: "",
      certificates: [],
      services: [],
      specialties: [],
    },
    mode: "onChange",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Social Media Links</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="instagram"
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
                        placeholder="Instagram username"
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
              name="facebook"
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
                        placeholder="Facebook username"
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
              name="twitter"
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
                        placeholder="Twitter username"
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
              name="tiktok"
              render={({ field }) => {
                const modifiedField = {
                  ...field,
                  value: field.value ?? "",
                };
                return (
                  <FormItem>
                    <FormLabel>TikTok</FormLabel>
                    <FormControl>
                      <Input placeholder="TikTok username" {...modifiedField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => {
              const modifiedField = {
                ...field,
                value: field.value ?? "",
              };
              return (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="Your website URL" {...modifiedField} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        {/* Note: The specialties, services, and certificates can be implemented with more advanced components
           like a multi-select or tag input, but for simplicity we're keeping them basic for now */}

        <Button
          type="submit"
          className="w-full md:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </Form>
  );
}
