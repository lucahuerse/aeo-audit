"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadSchema, Lead } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import qs from "query-string";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function LeadForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<Lead>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      domain: "",
    },
  });

  function onSubmit(values: Lead) {
    setIsSubmitting(true);
    setTimeout(() => {
      const url = qs.stringifyUrl({
        url: "/analyze",
        query: values,
      });
      router.push(url);
    }, 600);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 w-full max-w-md">
        <FormField
          control={form.control}
          name="domain"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website Domain</FormLabel>
              <FormControl>
                <Input placeholder="example.com" autoFocus {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                Wir normalisieren die URL automatisch für dich.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button type="submit" size="lg" className="w-full font-semibold" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Lade...
              </>
            ) : (
              "Kostenlosen Report erstellen"
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Dauer: ~30 Sekunden • Keine Anmeldung nötig
          </p>
        </div>
      </form>
    </Form>
  );
}
