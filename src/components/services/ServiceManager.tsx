"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Pencil, Trash, X, Check } from "lucide-react";
import { useServices } from "@/hooks/use-services";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  artistId: string;
}

interface ServiceFormData {
  id?: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  artistId: string;
}

interface ServiceManagerProps {
  userId: string;
}

export default function ServiceManager({ userId }: ServiceManagerProps) {
  const { services, isLoading, createService, updateService, deleteService } =
    useServices(userId);

  const [editingService, setEditingService] = useState<ServiceFormData | null>(
    null
  );
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Handle creating a new service
  const handleCreateService = async () => {
    if (!editingService) return;

    createService.mutate(editingService, {
      onSuccess: () => {
        setIsAddingNew(false);
        setEditingService(null);
      },
    });
  };

  // Handle updating a service
  const handleUpdateService = async () => {
    if (!editingService?.id) return;

    updateService.mutate(editingService, {
      onSuccess: () => {
        setEditingService(null);
      },
    });
  };

  // Handle deleting a service
  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    deleteService.mutate({ serviceId, artistId: userId });
  };

  // Start adding a new service
  const startAddNew = () => {
    setEditingService({
      name: "",
      description: "",
      price: 0,
      isActive: true,
      artistId: userId,
    });
    setIsAddingNew(true);
  };

  // Start editing a service
  const startEdit = (service: Service) => {
    setEditingService({
      id: service.id,
      name: service.name,
      description: service.description || "",
      price: service.price,
      isActive: service.isActive,
      artistId: service.artistId,
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingService(null);
    setIsAddingNew(false);
  };

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editingService) return;

    const { name, value } = e.target;
    setEditingService({
      ...editingService,
      [name]: name === "price" ? parseFloat(value) || 0 : value,
    });
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingService) return;

    const { name, checked } = e.target;
    setEditingService({
      ...editingService,
      [name]: checked,
    });
  };

  // Render a service form (for editing or creating)
  const renderServiceForm = () => {
    if (!editingService) return null;

    const isSubmitting = createService.isPending || updateService.isPending;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {isAddingNew ? "Add New Service" : "Edit Service"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                name="name"
                value={editingService.name}
                onChange={handleInputChange}
                placeholder="e.g., Bridal Makeup"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={editingService.description}
                onChange={handleInputChange}
                placeholder="Describe the service..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={editingService.price}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={editingService.isActive}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={cancelEdit}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={
                  isAddingNew ? handleCreateService : handleUpdateService
                }
                disabled={!editingService.name || isSubmitting}
              >
                <Check className="mr-2 h-4 w-4" />
                {isAddingNew ? "Create" : "Update"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render a service item
  const renderServiceItem = (service: Service) => {
    const isEditing = editingService?.id === service.id;

    if (isEditing) {
      return renderServiceForm();
    }

    return (
      <Card key={service.id} className="mb-4">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{service.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {service.description || "No description"}
              </p>
              <div className="flex items-center mt-2">
                <span className="font-medium">
                  EGP {service.price.toFixed(2)}
                </span>
                <span
                  className={`ml-3 px-2 py-1 text-xs rounded-full ${
                    service.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {service.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => startEdit(service)}
                disabled={!!editingService}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteService(service.id)}
                disabled={!!editingService || deleteService.isPending}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Services</h2>
        <Button
          onClick={startAddNew}
          disabled={!!editingService || isAddingNew}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {isAddingNew && renderServiceForm()}

      {isLoading ? (
        <div className="text-center py-10">Loading services...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No services found. Add your first service!
        </div>
      ) : (
        <div>
          {services.map((service: Service) => renderServiceItem(service))}
        </div>
      )}
    </div>
  );
}
