import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Edit, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import MapView from "@/components/Map";

export default function Destinations() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    country: "",
    latitude: "",
    longitude: "",
    image: "",
    metaTitle: "",
    metaDescription: "",
    ogImage: "",
  });

  const { data: destinations, refetch } = trpc.destinations.list.useQuery({ limit: 100 });
  const createMutation = trpc.destinations.create.useMutation({
    onSuccess: () => {
      toast.success("Destination created successfully");
      setFormData({
        name: "",
        slug: "",
        description: "",
        country: "",
        latitude: "",
        longitude: "",
        image: "",
        metaTitle: "",
        metaDescription: "",
        ogImage: "",
      });
      setIsOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create destination");
    },
  });

  const deleteMutation = trpc.destinations.delete.useMutation({
    onSuccess: () => {
      toast.success("Destination deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete destination");
    },
  });

  const handleCreate = () => {
    if (!formData.name || !formData.slug) {
      toast.error("Name and slug are required");
      return;
    }
    createMutation.mutate(formData);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this destination?")) {
      deleteMutation.mutate({ id });
    }
  };

  const isAdmin = user?.role === "admin";

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Destinations</h1>
            <p className="text-muted-foreground mt-2">Manage your travel destinations</p>
          </div>
          {isAdmin && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Destination
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Destination</DialogTitle>
                  <DialogDescription>Add a new travel destination</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Destination name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="destination-slug"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Country"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        placeholder="0.0000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        placeholder="0.0000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Destination description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">Image URL</Label>
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">SEO Metadata</h3>
                    <div>
                      <Label htmlFor="metaTitle">Meta Title</Label>
                      <Input
                        id="metaTitle"
                        value={formData.metaTitle}
                        onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                        placeholder="SEO title"
                      />
                    </div>
                    <div className="mt-2">
                      <Label htmlFor="metaDescription">Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        value={formData.metaDescription}
                        onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                        placeholder="SEO description"
                        rows={2}
                      />
                    </div>
                    <div className="mt-2">
                      <Label htmlFor="ogImage">OG Image URL</Label>
                      <Input
                        id="ogImage"
                        value={formData.ogImage}
                        onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                        placeholder="https://example.com/og-image.jpg"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full">
                    {createMutation.isPending ? "Creating..." : "Create Destination"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Destinations</CardTitle>
            <CardDescription>View and manage all travel destinations</CardDescription>
          </CardHeader>
          <CardContent>
            {destinations && destinations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {destinations.map((destination) => (
                  <div
                    key={destination.id}
                    className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {destination.image && (
                      <img
                        src={destination.image}
                        alt={destination.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg">{destination.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4" />
                        {destination.country}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {destination.description}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <span className="text-xs bg-secondary px-2 py-1 rounded">
                          {destination.status}
                        </span>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2 mt-4">
                          <Button variant="ghost" size="sm" className="flex-1">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDelete(destination.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No destinations yet. Create one to get started.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
