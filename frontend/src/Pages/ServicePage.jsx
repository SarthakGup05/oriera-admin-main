import React, { useEffect } from "react";
import DataTable from "../components/DataTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Camera,
  Image as ImageIcon,
  Star,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  Tag,
  Info,
  Loader2,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import useServicesStore from "@/store/useServiceStore";

export default function ServicesPage() {
  const { state } = useSidebar();
  
  // Zustand store selectors - destructure only what you need
  const {
    // State
    services,
    loading,
    dialogOpen,
    dialogMode,
    formData,
    imagePreview,
    uploadingImages,
    
    // Actions
    setDialogOpen,
    updateFormData,
    handleNameChange,
    fetchServices,
    deleteService,
    openAddDialog,
    openViewDialog,
    openEditDialog,
    handleSave,
    addFeature,
    removeFeature,
    updateFeature,
    handleImageUpload,
    removeImage,
    getStats,
  } = useServicesStore();

  // Fetch services on component mount
  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview.serviceImage && imagePreview.serviceImage.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview.serviceImage);
      }
    };
  }, [imagePreview.serviceImage]);

  // Dynamic spacing and container classes
  const getSpacing = () => {
    if (state === "expanded") {
      return "p-4 space-y-4";
    }
    return "p-6 space-y-6";
  };

  const getContainerClass = () => {
    if (state === "expanded") {
      return "max-w-none mx-2";
    }
    return "container mx-auto";
  };

  // Word count utility
  const getWordCount = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Description change handler with word limit
  const handleDescriptionChange = (value) => {
    const wordCount = getWordCount(value);
    if (wordCount <= 80) {
      updateFormData({ description: value });
    }
  };

  // Enhanced Loading Component
  const LoadingSpinner = ({ size = "sm", text = "" }) => (
    <div className="flex items-center justify-center space-x-2">
      <Loader2 className={`animate-spin ${size === "lg" ? "h-8 w-8" : "h-4 w-4"}`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );

  // Single Image Upload Component with Enhanced Loading
  const ImageUploadSection = ({ imageType, label, preview, isUploading }) => (
    <div className="space-y-3">
      <Label>{label}</Label>

      {/* Upload Area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors w-80 h-60 flex flex-col items-center justify-center relative ${
          dialogMode !== "view" 
            ? "border-gray-300 hover:border-gray-400 cursor-pointer" 
            : "border-gray-200"
        } ${isUploading ? "opacity-50 pointer-events-none" : ""}`}
        onClick={() => {
          if (dialogMode !== "view" && !isUploading) {
            document.getElementById(`file-input-${imageType}`)?.click();
          }
        }}
      >
        {isUploading ? (
          <div className="space-y-3">
            <LoadingSpinner size="lg" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">Uploading Image</p>
              <p className="text-xs text-gray-500">Please wait while we process your image...</p>
              <div className="w-48 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full animate-pulse" style={{ width: "60%" }}></div>
              </div>
            </div>
          </div>
        ) : preview ? (
          <div className="relative items-center w-full h-full">
            <img
              src={preview}
              alt={`${label} preview`}
              className="w-full h-40 object-cover rounded-lg"
              onError={(e) => {
                console.error('Image failed to load:', preview);
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPgo=';
                e.target.onerror = null;
              }}
            />
            {dialogMode !== "view" && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(imageType);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="h-12 w-12 mx-auto text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, JPEG up to 10MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      {dialogMode !== "view" && (
        <Input
          id={`file-input-${imageType}`}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              handleImageUpload(file, imageType);
            }
          }}
          disabled={isUploading}
          className="hidden"
        />
      )}
    </div>
  );

  // Table columns definition
  const columns = [
    {
      accessorKey: "coverImage",
      header: "Image",
      size: 80,
      cell: ({ getValue, row }) => (
        <div className="relative">
          <Avatar className="h-16 w-16 rounded-lg">
            <AvatarImage
              src={getValue() || row.original.serviceImage || row.original.mainImage}
              alt={row.original.title}
              className="object-cover"
            />
            <AvatarFallback className="rounded-lg">
              <ImageIcon className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          {row.original.featured && (
            <Star className="absolute -top-1 -right-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "title",
      header: "Service Details",
      cell: ({ getValue, row }) => (
        <div className="space-y-1">
          <p className="font-medium text-sm">{getValue()}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.subtitle}
          </p>
          <p className="text-xs text-muted-foreground">/{row.original.slug}</p>
          <div className="flex items-center space-x-2 flex-wrap">
            <Badge
              variant={row.original.isActive ? "default" : "secondary"}
              className="text-xs"
            >
              {row.original.isActive ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {row.original.isActive ? "Active" : "Inactive"}
            </Badge>
            {row.original.duration && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{row.original.duration}</span>
              </div>
            )}
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Tag className="h-3 w-3" />
              <span>{row.original.features?.length || 0} features</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      size: 300,
      cell: ({ getValue }) => {
        const description = getValue();
        const wordCount = getWordCount(description);
        return (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground line-clamp-3 max-w-xs">
              {description}
            </p>
            <p className="text-xs text-gray-400">
              {wordCount} words
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: "sortOrder",
      header: "Order",
      size: 80,
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-xs">
          #{getValue()}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 120,
      cell: ({ row }) => {
        const service = row.original;
        return (
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openViewDialog(service)}
              className="h-8 w-8 p-0"
              title="View Service"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openEditDialog(service)}
              className="h-8 w-8 p-0"
              title="Edit Service"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  title="Delete Service"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the service "{service.title}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteService(service.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  // Get computed stats from store
  const { totalServices, activeServices, featuredServices } = getStats();

  return (
    <div className={`${getContainerClass()} ${getSpacing()}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Photography Services
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Manage your photography services and portfolios
          </p>
        </div>
        <Button onClick={openAddDialog} className="w-fit" disabled={loading}>
          {loading ? (
            <LoadingSpinner text="Loading..." />
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add New Service
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 lg:gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Services
            </CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <LoadingSpinner /> : totalServices}
            </div>
            <p className="text-xs text-muted-foreground">Available services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Services
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? <LoadingSpinner /> : activeServices}
            </div>
            <p className="text-xs text-muted-foreground">Currently offered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {loading ? <LoadingSpinner /> : featuredServices}
            </div>
            <p className="text-xs text-muted-foreground">
              Highlighted services
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card>
        <CardHeader className={state === "expanded" ? "pb-4" : ""}>
          <CardTitle className="text-lg lg:text-xl">All Services</CardTitle>
          <CardDescription>
            Manage your photography services and their content
          </CardDescription>
        </CardHeader>
        <CardContent className={state === "expanded" ? "p-4" : ""}>
          <DataTable
            columns={columns}
            data={services}
            loading={loading}
            enableSorting={true}
            enableFiltering={true}
            enablePagination={true}
            pageSize={10}
            emptyMessage="No services found"
            className="border-0"
          />
        </CardContent>
      </Card>

      {/* Dialog with Enhanced Loading States */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" && "Add New Service"}
              {dialogMode === "edit" && "Edit Service"}
              {dialogMode === "view" && "Service Details"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "add" &&
                "Create a new photography service with all details."}
              {dialogMode === "edit" &&
                "Update the service details and content."}
              {dialogMode === "view" &&
                "View the complete service information."}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" disabled={loading}>Basic Info</TabsTrigger>
              <TabsTrigger value="images" disabled={loading}>Image</TabsTrigger>
              <TabsTrigger value="features" disabled={loading}>Features</TabsTrigger>
              <TabsTrigger value="seo" disabled={loading}>SEO & Settings</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Service Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      disabled={dialogMode === "view" || loading}
                      placeholder="wedding-photography-premium"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) =>
                        updateFormData({ slug: e.target.value })
                      }
                      disabled={dialogMode === "view" || loading}
                      placeholder="url-friendly-name"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Display Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        updateFormData({ title: e.target.value })
                      }
                      disabled={dialogMode === "view" || loading}
                      placeholder="Wedding Photography"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtitle">Subtitle *</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) =>
                        updateFormData({ subtitle: e.target.value })
                      }
                      disabled={dialogMode === "view" || loading}
                      placeholder="Capturing Love Stories"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="description">Description *</Label>
                    <span className={`text-xs ${
                      getWordCount(formData.description) > 80 
                        ? "text-red-500 font-medium" 
                        : "text-gray-500"
                    }`}>
                      {getWordCount(formData.description)}/80 words
                    </span>
                  </div>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    disabled={dialogMode === "view" || loading}
                    placeholder="Describe your service in detail... (Max 80 words)"
                    rows={4}
                    className={`mt-1 ${
                      getWordCount(formData.description) > 80 
                        ? "border-red-300 focus:border-red-500" 
                        : ""
                    }`}
                    required
                  />
                  {getWordCount(formData.description) > 80 && (
                    <p className="text-xs text-red-500 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Description exceeds the 80-word limit. Please shorten it.
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="duration">Session Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) =>
                      updateFormData({ duration: e.target.value })
                    }
                    disabled={dialogMode === "view" || loading}
                    placeholder="8+ hours"
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Enhanced Image Tab */}
            <TabsContent value="images" className="space-y-6">
              <ImageUploadSection
                imageType="serviceImage"
                label="Service Image"
                preview={imagePreview.serviceImage}
                isUploading={uploadingImages.serviceImage}
              />
              
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">
                      Single Image Usage
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      This image will be used as both the cover image in the table view 
                      and the main service image throughout your website. This ensures 
                      consistency and reduces storage requirements.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Features Tab */}
            <TabsContent value="features" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Service Features</Label>
                {dialogMode !== "view" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFeature}
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Feature
                  </Button>
                )}
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {formData.features?.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      disabled={dialogMode === "view" || loading}
                      placeholder="Enter service feature"
                      className="flex-1"
                    />
                    {dialogMode !== "view" && formData.features.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFeature(index)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* SEO & Settings Tab */}
            <TabsContent value="seo" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) =>
                      updateFormData({ metaTitle: e.target.value })
                    }
                    disabled={dialogMode === "view" || loading}
                    placeholder="SEO optimized title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) =>
                      updateFormData({ metaDescription: e.target.value })
                    }
                    disabled={dialogMode === "view" || loading}
                    placeholder="SEO description for search engines"
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      updateFormData({ 
                        sortOrder: parseInt(e.target.value) || 0 
                      })
                    }
                    disabled={dialogMode === "view" || loading}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active Status</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active services are visible to customers
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(val) =>
                      updateFormData({ isActive: val })
                    }
                    disabled={dialogMode === "view" || loading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Featured Service</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Featured services will be highlighted
                    </p>
                  </div>
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(val) =>
                      updateFormData({ featured: val })
                    }
                    disabled={dialogMode === "view" || loading}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              {dialogMode === "view" ? "Close" : "Cancel"}
            </Button>
            {dialogMode !== "view" && (
              <Button 
                onClick={handleSave} 
                disabled={loading || getWordCount(formData.description) > 80}
              >
                {loading ? (
                  <LoadingSpinner text={dialogMode === "add" ? "Adding..." : "Saving..."} />
                ) : (
                  dialogMode === "add" ? "Add Service" : "Save Changes"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
