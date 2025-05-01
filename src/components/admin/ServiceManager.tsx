import React, { useState } from "react";
import { X, PlusCircle, Edit, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";

interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  isActive?: boolean;
}

interface ServiceManagerProps {
  services: Service[];
  onChange: (services: Service[]) => void;
}

export function ServiceManager({
  services = [],
  onChange,
}: ServiceManagerProps) {
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state for adding/editing service
  const [formData, setFormData] = useState<Service>({
    id: "",
    name: "",
    description: "",
    price: 0,
    duration: 60,
    isActive: true,
  });

  const handleAddService = () => {
    setEditingService(null);
    setFormData({
      id: crypto.randomUUID(),
      name: "",
      description: "",
      price: 0,
      duration: 60,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData({ ...service });
    setIsDialogOpen(true);
  };

  const handleDeleteService = (serviceId: string) => {
    const updatedServices = services.filter((s) => s.id !== serviceId);
    onChange(updatedServices);
    toast({
      title: "Service deleted",
      description: "The service has been removed",
      variant: "default",
    });
  };

  const handleServiceFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: "Error",
        description: "Service name is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.price < 0) {
      toast({
        title: "Error",
        description: "Price cannot be negative",
        variant: "destructive",
      });
      return;
    }

    let updatedServices: Service[];

    if (editingService) {
      // Update existing service
      updatedServices = services.map((s) =>
        s.id === formData.id ? { ...formData } : s
      );
    } else {
      // Add new service
      updatedServices = [...services, formData];
    }

    onChange(updatedServices);
    setIsDialogOpen(false);
    toast({
      title: editingService ? "Service updated" : "Service added",
      description: editingService
        ? "The service has been updated"
        : "New service has been added",
      variant: "default",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: parseFloat(value) || 0 });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({ ...formData, isActive: checked });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Services</CardTitle>
        <CardDescription>
          Manage the services offered by this artist
        </CardDescription>
      </CardHeader>
      <CardContent>
        {services.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No services added yet. Click 'Add Service' to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Price (EGP)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{service.price} EGP</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        service.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {service.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditService(service)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteService(service.id)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleAddService}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </CardFooter>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Edit Service" : "Add New Service"}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? "Edit the details of this service"
                : "Fill in the details to add a new service"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleServiceFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Bridal Makeup"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Price (EGP) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleNumberChange}
                  className="col-span-3"
                  placeholder="500"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duration (min)
                </Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="0"
                  step="15"
                  value={formData.duration}
                  onChange={handleNumberChange}
                  className="col-span-3"
                  placeholder="60"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Describe the service..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isActive" className="text-right">
                  Active
                </Label>
                <div className="col-span-3 flex items-center">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Service is available for booking
                  </label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {editingService ? "Save Changes" : "Add Service"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
