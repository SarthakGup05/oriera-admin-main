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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  Trash2,
  Plus,
  Camera,
  Image as ImageIcon,
  Star,
  Grid,
  Upload,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Tag,
  Filter,
  Search,
  Loader2,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import useGalleryStore from "@/store/useGalleryStore";

const GalleryPage = () => {
  const { state } = useSidebar();

  // Cache busting function
  const addCacheBuster = (url) => {
    if (!url) return url;
    // Don't add cache buster to blob URLs
    if (url.startsWith('blob:')) return url;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${Date.now()}`;
  };
  
  // Zustand store selectors - FIXED: Using individual selectors to prevent unnecessary re-renders
  const images = useGalleryStore(state => state.images);
  const services = useGalleryStore(state => state.services);
  const categories = useGalleryStore(state => state.categories);
  const loading = useGalleryStore(state => state.loading);
  const uploadingImage = useGalleryStore(state => state.uploadingImage);
  const saving = useGalleryStore(state => state.saving);
  const deleting = useGalleryStore(state => state.deleting);
  const searchTerm = useGalleryStore(state => state.searchTerm);
  const selectedCategory = useGalleryStore(state => state.selectedCategory);
  const selectedService = useGalleryStore(state => state.selectedService);
  const dialogOpen = useGalleryStore(state => state.dialogOpen);
  const dialogMode = useGalleryStore(state => state.dialogMode);
  const selectedImage = useGalleryStore(state => state.selectedImage);
  const formData = useGalleryStore(state => state.formData);
  const imagePreview = useGalleryStore(state => state.imagePreview);
  const selectedFile = useGalleryStore(state => state.selectedFile);

  // Actions
  const setSearchTerm = useGalleryStore(state => state.setSearchTerm);
  const setSelectedCategory = useGalleryStore(state => state.setSelectedCategory);
  const setSelectedService = useGalleryStore(state => state.setSelectedService);
  const setDialogOpen = useGalleryStore(state => state.setDialogOpen);
  const updateFormField = useGalleryStore(state => state.updateFormField);
  
  // API Actions
  const fetchImages = useGalleryStore(state => state.fetchImages);
  const fetchServices = useGalleryStore(state => state.fetchServices);
  const fetchCategories = useGalleryStore(state => state.fetchCategories);
  const uploadImage = useGalleryStore(state => state.uploadImage);
  const removeImage = useGalleryStore(state => state.removeImage);
  const openAddDialog = useGalleryStore(state => state.openAddDialog);
  const openViewDialog = useGalleryStore(state => state.openViewDialog);
  const deleteImage = useGalleryStore(state => state.deleteImage);
  const saveImage = useGalleryStore(state => state.saveImage);
  const closeDialog = useGalleryStore(state => state.closeDialog);
  
  // Computed
  const getFilteredImages = useGalleryStore(state => state.getFilteredImages);
  const getStats = useGalleryStore(state => state.getStats);

  // Get computed values
  const filteredImages = getFilteredImages();
  const { totalImages, activeImages, featuredImages } = getStats();

  useEffect(() => {
    fetchImages();
    fetchServices();
    fetchCategories();
  }, [fetchImages, fetchServices, fetchCategories]);

  // FIXED: Event handlers using proper store methods
  const handleImageUpload = async (file) => {
    if (file) {
      await uploadImage(file);
    }
  };

  // FIXED: Use the store's updateFormField method instead of direct object spreading
  const handleFormDataUpdate = (field, value) => {
    updateFormField(field, value);
  };

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

  // FIXED: Enhanced Image Upload Component with cache busting
  const ImageUploadSection = ({ preview, isUploading }) => (
    <div className="space-y-3">
      <Label>Gallery Image *</Label>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        {preview ? (
          <div className="relative">
            <img
              src={addCacheBuster(preview)}
              alt="Image preview"
              className="w-full h-64 object-cover rounded-lg"
              key={preview} // Force re-render when preview changes
              onLoad={() => console.log("✅ Image loaded:", preview)}
              onError={(e) => {
                console.error('❌ Image failed to load:', preview);
                // Show fallback image
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPgo=';
                e.target.onerror = null;
                
                // If it's a blob URL that failed, try to handle it
                if (preview && preview.startsWith('blob:')) {
                  console.warn('⚠️ Blob URL failed, removing preview');
                  removeImage();
                }
              }}
            />
            {dialogMode !== "view" && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={removeImage}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {isUploading ? (
              <Loader2 className="h-12 w-12 mx-auto text-gray-400 animate-spin" />
            ) : (
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
            )}
            <div>
              <p className="text-sm text-gray-600">
                {isUploading ? "Processing..." : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-400">PNG, JPG, JPEG up to 10MB</p>
            </div>
          </div>
        )}
      </div>

      {dialogMode !== "view" && (
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            console.log("📁 File input onChange triggered");
            const file = e.target.files[0];
            if (file) {
              console.log("📁 File selected:", file.name);
              handleImageUpload(file);
            }
            // Reset input for future selections
            e.target.value = '';
          }}
          disabled={isUploading || saving}
          className="cursor-pointer"
        />
      )}

      {isUploading && (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Loader2 className="animate-spin h-4 w-4" />
          <span>Processing image...</span>
        </div>
      )}
    </div>
  );

  // Table columns definition with cache busting - EDIT BUTTON REMOVED
  const columns = [
    {
      accessorKey: "src",
      header: "Image",
      size: 80,
      cell: ({ getValue, row }) => (
        <div className="relative">
          <Avatar className="h-16 w-16 rounded-lg">
            <AvatarImage
              src={addCacheBuster(row.original.thumb || getValue())}
              alt={row.original.alt}
              className="object-cover"
              key={row.original.id} // Force re-render when data changes
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
      header: "Image Details",
      cell: ({ getValue, row }) => (
        <div className="space-y-1">
          <p className="font-medium text-sm">{getValue()}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.alt}
          </p>
          <div className="flex items-center space-x-2">
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
            <Badge variant="outline" className="text-xs capitalize">
              <Tag className="h-3 w-3 mr-1" />
              {row.original.category}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      size: 300,
      cell: ({ getValue }) => (
        <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
          {getValue() || "No description"}
        </p>
      ),
    },
    {
      accessorKey: "service",
      header: "Linked Service",
      cell: ({ row }) => {
        const service = row.original.service;
        return service ? (
          <Badge variant="outline" className="text-xs">
            <Camera className="h-3 w-3 mr-1" />
            {service.title}
          </Badge>
        ) : (
          <span className="text-xs text-gray-400">No service</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Upload Date",
      cell: ({ getValue }) => (
        <div className="text-xs text-gray-500">
          <Calendar className="h-3 w-3 inline mr-1" />
          {new Date(getValue()).toLocaleDateString()}
        </div>
      ),
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
        const image = row.original;
        const isDeleting = deleting === image.id;
        
        return (
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                console.log("👁️ View button clicked for image:", image.id);
                openViewDialog(image);
              }}
              className="h-8 w-8 p-0"
              disabled={isDeleting}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {/* EDIT BUTTON REMOVED */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the image "{image.title}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      console.log("🗑️ Delete confirmed for image:", image.id);
                      deleteImage(image.id);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  return (
    <div className={`${getContainerClass()} ${getSpacing()}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Gallery Management
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Manage your photography portfolio and gallery images
          </p>
        </div>
        <Button 
          type="button"
          onClick={() => {
            console.log("➕ Add new image button clicked");
            openAddDialog();
          }} 
          className="w-fit"
          disabled={saving || loading}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add New Image
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 lg:gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImages}</div>
            <p className="text-xs text-muted-foreground">
              Images in gallery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Images</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeImages}
            </div>
            <p className="text-xs text-muted-foreground">
              Publicly visible
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {featuredImages}
            </div>
            <p className="text-xs text-muted-foreground">
              Highlighted images
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by title, category, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="capitalize">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="service">Service</Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Services" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    <SelectItem value="unlinked">Unlinked</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id.toString()}>
                        {service.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Card */}
      <Card>
        <CardHeader className={state === "expanded" ? "pb-4" : ""}>
          <CardTitle className="text-lg lg:text-xl">
            Gallery Images ({filteredImages.length})
          </CardTitle>
          <CardDescription>
            Manage your photography portfolio images
          </CardDescription>
        </CardHeader>
        <CardContent className={state === "expanded" ? "p-4" : ""}>
          <DataTable
            columns={columns}
            data={filteredImages}
            loading={loading}
            enableSorting={true}
            enableFiltering={false}
            enablePagination={true}
            pageSize={10}
            emptyMessage="No images found"
            className="border-0"
          />
        </CardContent>
      </Card>

      {/* Enhanced Dialog for Image Management */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        console.log("🔷 Dialog state changing to:", open);
        if (!open) {
          closeDialog(); // Use the store's closeDialog method for proper cleanup
        } else {
          setDialogOpen(open);
        }
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" && "Add New Image"}
              {dialogMode === "edit" && "Edit Image"}
              {dialogMode === "view" && "Image Details"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "add" &&
                "Upload a new image to your gallery portfolio."}
              {dialogMode === "edit" &&
                "Update the image details and metadata."}
              {dialogMode === "view" &&
                "View the complete image information."}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="image">Image</TabsTrigger>
              <TabsTrigger value="seo">SEO & Settings</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Image Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => {
                        console.log("📝 Title field changed:", e.target.value);
                        handleFormDataUpdate('title', e.target.value);
                      }}
                      disabled={dialogMode === "view"}
                      placeholder="Beautiful Wedding Ceremony"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="alt">Alt Text *</Label>
                    <Input
                      id="alt"
                      value={formData.alt}
                      onChange={(e) => {
                        console.log("📝 Alt field changed:", e.target.value);
                        handleFormDataUpdate('alt', e.target.value);
                      }}
                      disabled={dialogMode === "view"}
                      placeholder="Wedding Photography"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => {
                        console.log("📝 Category field changed:", e.target.value);
                        handleFormDataUpdate('category', e.target.value);
                      }}
                      disabled={dialogMode === "view"}
                      placeholder="wedding"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serviceId">Linked Service</Label>
                    <Select
                      value={formData.serviceId?.toString() || "none"}
                      onValueChange={(value) => {
                        console.log("📝 Service field changed:", value);
                        handleFormDataUpdate('serviceId', value === "none" ? null : parseInt(value));
                      }}
                      disabled={dialogMode === "view"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No service</SelectItem>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id.toString()}>
                            {service.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => {
                      console.log("📝 Description field changed");
                      handleFormDataUpdate('description', e.target.value);
                    }}
                    disabled={dialogMode === "view"}
                    placeholder="Describe this image..."
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
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      console.log("📝 Sort order changed:", value);
                      handleFormDataUpdate('sortOrder', value);
                    }}
                    disabled={dialogMode === "view"}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Image Upload Tab */}
            <TabsContent value="image" className="space-y-6">
              <ImageUploadSection
                preview={imagePreview}
                isUploading={uploadingImage}
              />
            </TabsContent>

            {/* SEO & Settings Tab */}
            <TabsContent value="seo" className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => handleFormDataUpdate('metaTitle', e.target.value)}
                    disabled={dialogMode === "view"}
                    placeholder="SEO optimized title"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={formData.metaDescription}
                    onChange={(e) => handleFormDataUpdate('metaDescription', e.target.value)}
                    disabled={dialogMode === "view"}
                    placeholder="SEO description for search engines"
                    rows={3}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Active Status</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active images are visible in the gallery
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(val) => {
                      console.log("🔄 Active status changed:", val);
                      handleFormDataUpdate('isActive', val);
                    }}
                    disabled={dialogMode === "view"}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Featured Image</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Featured images will be highlighted in the gallery
                    </p>
                  </div>
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(val) => {
                      console.log("⭐ Featured status changed:", val);
                      handleFormDataUpdate('featured', val);
                    }}
                    disabled={dialogMode === "view"}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                console.log("❌ Cancel/Close button clicked");
                closeDialog();
              }}
              disabled={saving}
            >
              {dialogMode === "view" ? "Close" : "Cancel"}
            </Button>
            {dialogMode !== "view" && (
              <Button 
                onClick={() => {
                  console.log("💾 Save button clicked, mode:", dialogMode);
                  saveImage();
                }}
                disabled={saving || uploadingImage}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {dialogMode === "add" ? "Uploading..." : "Saving..."}
                  </>
                ) : (
                  dialogMode === "add" ? "Add Image" : "Save Changes"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryPage;
