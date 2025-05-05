"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Trash, MoveUp, MoveDown } from "lucide-react";
import type { ConfigurationWithButtons } from "@/types";
import { createConfiguration, updateConfiguration } from "@/app/actions";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  entity_type: z.string().min(1, "Entity type is required"),
  background_image_url: z
    .string()
    .url("Must be a valid URL")
    .nullable()
    .optional(),
  show_menu_button: z.any().default(false),
  menu_button_text: z.string().nullable().optional(),
  menu_button_link: z.string().url("Must be a valid URL").nullable().optional(),
  wifi_config_url: z.string().url("Must be a valid URL").nullable().optional(),
});

type FormValues = z.output<typeof formSchema>;

interface CustomButton {
  id?: string;
  button_text: string;
  button_url: string;
  display_order: number;
  is_active: boolean;
}

export default function ConfigurationForm({
  configuration,
}: {
  configuration?: ConfigurationWithButtons;
}) {
  const isEditing = !!configuration;
  const router = useRouter();
  const { toast } = useToast();

  const [customButtons, setCustomButtons] = useState<CustomButton[]>(
    configuration?.custom_buttons?.sort(
      (a, b) => a.display_order - b.display_order
    ) || []
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: configuration?.name || "",
      entity_type: configuration?.entity_type || "",
      background_image_url: configuration?.background_image_url || "",
      show_menu_button: Boolean(configuration?.show_menu_button) || false,
      menu_button_text: configuration?.menu_button_text || "",
      menu_button_link: configuration?.menu_button_link || "",
      wifi_config_url: configuration?.wifi_config_url || "",
    },
  });

  const showMenuButton = watch("show_menu_button");

  const addCustomButton = () => {
    setCustomButtons([
      ...customButtons,
      {
        button_text: "",
        button_url: "",
        display_order: customButtons.length,
        is_active: true,
      },
    ]);
  };

  const removeCustomButton = (index: number) => {
    setCustomButtons(customButtons.filter((_, i) => i !== index));
  };

  const updateCustomButton = (
    index: number,
    field: keyof CustomButton,
    value: any
  ) => {
    const updatedButtons = [...customButtons];
    updatedButtons[index] = {
      ...updatedButtons[index],
      [field]: value,
    };
    setCustomButtons(updatedButtons);
  };

  const moveButtonUp = (index: number) => {
    if (index === 0) return;

    const updatedButtons = [...customButtons];
    const temp = updatedButtons[index - 1];
    updatedButtons[index - 1] = {
      ...updatedButtons[index],
      display_order: index - 1,
    };
    updatedButtons[index] = {
      ...temp,
      display_order: index,
    };
    setCustomButtons(updatedButtons);
  };

  const moveButtonDown = (index: number) => {
    if (index === customButtons.length - 1) return;

    const updatedButtons = [...customButtons];
    const temp = updatedButtons[index + 1];
    updatedButtons[index + 1] = {
      ...updatedButtons[index],
      display_order: index + 1,
    };
    updatedButtons[index] = {
      ...temp,
      display_order: index,
    };
    setCustomButtons(updatedButtons);
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // Create a FormData object
      const formData = new FormData();
      console.log("data", data);

      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (typeof value === "boolean") {
            formData.append(key, value ? "on" : "off");
          } else {
            formData.append(key, value as string);
          }
        }
      });

      // Add custom buttons as JSON
      formData.append("custom_buttons", JSON.stringify(customButtons));

      if (isEditing && configuration) {
        await updateConfiguration(configuration.id, formData);
        toast({
          title: "Configuration updated",
          description: "Your configuration has been updated successfully",
        });
      } else {
        await createConfiguration(formData);
        toast({
          title: "Configuration created",
          description: "Your new configuration has been created successfully",
        });
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Table 1, Store Entrance, etc."
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity_type">Entity Type</Label>
            <Input
              id="entity_type"
              {...register("entity_type")}
              placeholder="table, store, room, etc."
            />
            {errors.entity_type && (
              <p className="text-sm text-red-500">
                {errors.entity_type.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="background_image_url">Background Image URL</Label>
          <Input
            id="background_image_url"
            {...register("background_image_url")}
            placeholder="https://example.com/image.jpg"
          />
          {errors.background_image_url && (
            <p className="text-sm text-red-500">
              {errors.background_image_url.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="show_menu_button"
              onCheckedChange={(checked) => {
                setValue("show_menu_button", checked);
              }}
              {...register("show_menu_button")}
              defaultChecked={configuration?.show_menu_button}
            />
            <Label htmlFor="show_menu_button">Show Menu Button</Label>
          </div>
        </div>

        {showMenuButton && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="menu_button_text">Menu Button Text</Label>
              <Input
                id="menu_button_text"
                {...register("menu_button_text")}
                placeholder="View Menu"
              />
              {errors.menu_button_text && (
                <p className="text-sm text-red-500">
                  {errors.menu_button_text.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu_button_link">Menu Button Link</Label>
              <Input
                id="menu_button_link"
                {...register("menu_button_link")}
                placeholder="https://example.com/menu"
              />
              {errors.menu_button_link && (
                <p className="text-sm text-red-500">
                  {errors.menu_button_link.message}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="wifi_config_url">Wi-Fi Configuration URL</Label>
          <Input
            id="wifi_config_url"
            {...register("wifi_config_url")}
            placeholder="https://example.com/wifi-config"
          />
          {errors.wifi_config_url && (
            <p className="text-sm text-red-500">
              {errors.wifi_config_url.message}
            </p>
          )}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Custom Buttons</h3>
          <Button type="button" variant="outline" onClick={addCustomButton}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Button
          </Button>
        </div>

        {customButtons.length === 0 ? (
          <p className="text-sm text-gray-500">No custom buttons added yet</p>
        ) : (
          <div className="space-y-4">
            {customButtons.map((button, index) => (
              <div key={index} className="border rounded-md p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Button {index + 1}</h4>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveButtonUp(index)}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                      <span className="sr-only">Move Up</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveButtonDown(index)}
                      disabled={index === customButtons.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                      <span className="sr-only">Move Down</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => removeCustomButton(index)}
                    >
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`button-text-${index}`}>Button Text</Label>
                    <Input
                      id={`button-text-${index}`}
                      value={button.button_text}
                      onChange={(e) =>
                        updateCustomButton(index, "button_text", e.target.value)
                      }
                      placeholder="Visit Website"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`button-url-${index}`}>Button URL</Label>
                    <Input
                      id={`button-url-${index}`}
                      value={button.button_url}
                      onChange={(e) =>
                        updateCustomButton(index, "button_url", e.target.value)
                      }
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`button-active-${index}`}
                    checked={button.is_active}
                    onCheckedChange={(checked) =>
                      updateCustomButton(index, "is_active", checked === true)
                    }
                  />
                  <Label htmlFor={`button-active-${index}`}>Active</Label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/dashboard")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  );
}
