// src/Pages/SliderPage.jsx
import React, { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import DataTable from "../components/DataTable";
import useSliderStore from "@/store/useSliderstore";

/* ─── UI components ─────────────────────────────────────────────── */
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

/* ─── Icons ─────────────────────────────────────────────────────── */
import {
  Upload,
  X,
  Plus,
  Eye,
  Edit,
  Trash2,
  Play,
  FileImage,
  Video,
  Loader2,
} from "lucide-react";

const SliderPage = () => {
  const { state: sidebar } = useSidebar();
  
  // Zustand store selectors
  const {
    // State
    items,
    loading,
    saving,
    deleting,
    dialogOpen,
    mode,
    selected,
    form,
    mediaPreview,
    posterPreview,
    
    // Actions
    fetchSliders,
    openAdd,
    openView,
    openEdit,
    closeDialog,
    saveSlider,
    deleteSlider,
    handleMedia,
    handlePoster,
    handleTypeChange,
    updateForm,
    
    // Computed
    getStats,
    getSortedItems
  } = useSliderStore();

  // Get computed values
  const stats = getStats();
  const sortedItems = getSortedItems();

  useEffect(() => {
    fetchSliders();
  }, [fetchSliders]);

  // Event handlers
  const handleFormUpdate = (field, value) => {
    updateForm(field, value);
  };

  // Layout helpers
  const spacing = sidebar === "expanded" ? "p-4 space-y-4" : "p-6 space-y-6";
  const container = sidebar === "expanded" ? "max-w-none mx-2" : "container mx-auto";

  // Table columns definition
  const columns = [
    {
      accessorKey: "mediaUrl",
      header: "Preview",
      size: 90,
      cell: ({ row }) => {
        const item = row.original;
        const thumb = item.type === "IMAGE" ? item.mediaUrl : item.posterUrl || "";
        return (
          <Avatar className="h-16 w-16 rounded-lg">
            {thumb ? (
              <AvatarImage src={thumb} className="object-cover" />
            ) : (
              <AvatarFallback className="rounded-lg bg-gray-100">
                {item.type === "IMAGE" ? (
                  <ImageFallback />
                ) : (
                  <Play className="h-5 w-5 text-gray-500" />
                )}
              </AvatarFallback>
            )}
          </Avatar>
        );
      },
    },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "subtitle", header: "Subtitle" },
    { 
      accessorKey: "type", 
      header: "Type", 
      size: 60,
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.original.type === 'IMAGE' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-purple-100 text-purple-800'
        }`}>
          {row.original.type}
        </span>
      )
    },
    { accessorKey: "order", header: "Order", size: 50 },
    {
      accessorKey: "isActive",
      header: "Status",
      size: 80,
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            row.original.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {row.original.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 110,
      cell: ({ row }) => {
        const item = row.original;
        const isDeleting = deleting[item.id];
        
        return (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => openView(item)}
              disabled={isDeleting}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => openEdit(item)}
              disabled={isDeleting}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
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
                  <AlertDialogTitle>Delete slide?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the slide "{item.title}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive hover:bg-destructive/90"
                    onClick={() => deleteSlider(item.id)}
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
    <div className={`${container} ${spacing}`}>
      {/* Header */}
      <Header onAdd={openAdd} />
      
      {/* Enhanced Stats */}
      <EnhancedStats stats={stats} />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Slides ({sortedItems.length})</CardTitle>
          <CardDescription>
            Manage your homepage slider content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={sortedItems}
            columns={columns}
            loading={loading}
            enablePagination
            pageSize={8}
            emptyMessage="No slides found"
          />
        </CardContent>
      </Card>

      {/* Enhanced Dialog */}
      <SliderDialog
        open={dialogOpen}
        onOpenChange={closeDialog}
        mode={mode}
        form={form}
        updateForm={handleFormUpdate}
        mediaPreview={mediaPreview}
        posterPreview={posterPreview}
        handleMedia={handleMedia}
        handlePoster={handlePoster}
        handleTypeChange={handleTypeChange}
        onSave={saveSlider}
        saving={saving}
      />
    </div>
  );
};

/* ───── Enhanced Components ─────────────────────────────────────── */

// Enhanced Header Component
const Header = ({ onAdd }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
    <div>
      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
        Slider Management
      </h1>
      <p className="text-muted-foreground text-sm lg:text-base">
        Manage your homepage slider content and media
      </p>
    </div>
    <Button onClick={onAdd}>
      <Plus className="h-4 w-4 mr-2" />
      Add New Slide
    </Button>
  </div>
);

// Enhanced Stats Component
const EnhancedStats = ({ stats }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Slides</CardTitle>
        <FileImage className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.total}</div>
        <p className="text-xs text-muted-foreground">
          All slides in system
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Active Slides</CardTitle>
        <Eye className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
        <p className="text-xs text-muted-foreground">
          Currently visible
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Images</CardTitle>
        <FileImage className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-blue-600">{stats.images}</div>
        <p className="text-xs text-muted-foreground">
          Image slides
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Videos</CardTitle>
        <Video className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-purple-600">{stats.videos}</div>
        <p className="text-xs text-muted-foreground">
          Video slides
        </p>
      </CardContent>
    </Card>
  </div>
);

// Enhanced Dialog Component
const SliderDialog = ({
  open,
  onOpenChange,
  mode,
  form,
  updateForm,
  mediaPreview,
  posterPreview,
  handleMedia,
  handlePoster,
  handleTypeChange,
  onSave,
  saving,
}) => {
  const isReadOnly = mode === "view";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "Add New Slide"}
            {mode === "edit" && "Edit Slide"}
            {mode === "view" && "View Slide"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter slide title..."
              />
            </div>

            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={form.subtitle}
                onChange={(e) => updateForm('subtitle', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter slide subtitle..."
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter slide description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Media Type</Label>
                <Select
                  value={form.type}
                  onValueChange={handleTypeChange}
                  disabled={isReadOnly}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={form.order}
                  onChange={(e) =>
                    updateForm('order', parseInt(e.target.value, 10) || 0)
                  }
                  disabled={isReadOnly}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => updateForm('isActive', checked)}
                disabled={isReadOnly}
              />
              <Label htmlFor="isActive">Active (visible on homepage)</Label>
            </div>
          </div>

          {/* Media Upload/Preview Section */}
          {!isReadOnly && (
            <div className="space-y-4">
              <div>
                <Label>
                  {form.type === "IMAGE" ? "Image" : "Video"}{" "}
                  {mode === "add" && "*"}
                </Label>
                <MediaUploadArea
                  type={form.type}
                  preview={mediaPreview}
                  onFileSelect={handleMedia}
                />
              </div>

              {form.type === "VIDEO" && (
                <div>
                  <Label>Video Poster/Thumbnail</Label>
                  <MediaUploadArea
                    type="IMAGE"
                    preview={posterPreview}
                    onFileSelect={handlePoster}
                  />
                </div>
              )}
            </div>
          )}

          {/* Read-only Preview Section */}
          {isReadOnly && (
            <div className="space-y-4">
              <div>
                <Label>Media Preview</Label>
                <MediaPreview type={form.type} preview={mediaPreview} />
              </div>
              {form.type === "VIDEO" && posterPreview && (
                <div>
                  <Label>Video Poster</Label>
                  <MediaPreview type="IMAGE" preview={posterPreview} />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onOpenChange} disabled={saving}>
            {isReadOnly ? "Close" : "Cancel"}
          </Button>
          {!isReadOnly && (
            <Button onClick={onSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === "add" ? "Adding..." : "Saving..."}
                </>
              ) : (
                mode === "add" ? "Add Slide" : "Save Changes"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ───── Media Components (same as original but enhanced) ─────────── */
const MediaUploadArea = ({ type, preview, onFileSelect }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };
  
  const handleInput = (e) => {
  const file = e.target.files[0]; // ✅ pick the first file
  if (file) onFileSelect(file);
};
  
  const accept = type === "IMAGE" ? "image/*" : "video/*";

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {preview ? (
        <div className="space-y-3">
          <MediaPreview type={type} preview={preview} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(`file-${type}`).click()}
          >
            Change {type === "IMAGE" ? "Image" : "Video"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {type === "IMAGE" ? (
            <FileImage className="h-12 w-12 mx-auto text-gray-400" />
          ) : (
            <Video className="h-12 w-12 mx-auto text-gray-400" />
          )}
          <div>
            <Button
              variant="outline"
              onClick={() => document.getElementById(`file-${type}`).click()}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload {type === "IMAGE" ? "Image" : "Video"}
            </Button>
            <p className="text-sm text-gray-600 mt-2">Or drag and drop here</p>
            <p className="text-xs text-gray-400">Max size: 10 MB</p>
          </div>
        </div>
      )}
      <input
        id={`file-${type}`}
        type="file"
        accept={accept}
        onChange={handleInput}
        className="hidden"
      />
    </div>
  );
};

const MediaPreview = ({ type, preview }) => {
  if (!preview) return null;
  
  return (
    <div className="max-w-xs mx-auto">
      {type === "IMAGE" ? (
        <img
          src={preview}
          alt="Preview"
          className="w-full h-40 object-cover rounded-lg border shadow-sm"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+Cjwvc3ZnPgo='
          }}
        />
      ) : (
        <video
          src={preview}
          controls
          className="w-full h-40 object-cover rounded-lg border shadow-sm"
          onError={(e) => {
            console.error('Video failed to load:', preview)
          }}
        />
      )}
    </div>
  );
};

const ImageFallback = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 text-gray-400">
    <path
      fill="currentColor"
      d="M21 5v14H3V5h18m0-2H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-11 9-2.5 3.01L7 13l-4 5h14Z"
    />
  </svg>
);

export default SliderPage;
