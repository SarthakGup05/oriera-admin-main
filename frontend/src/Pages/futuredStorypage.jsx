// src/Pages/FeaturedStoriesPage.jsx
import React, { useState, useEffect } from "react";
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
  Eye,
  Edit,
  Trash2,
  Plus,
  Heart,
  MapPin,
  BookOpen,
  Star,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSidebar } from "@/components/ui/sidebar";
import { toast } from "react-hot-toast";
import axiosInstance from "../lib/axiosinstaance";

const FeaturedStoriesPage = () => {
  /* ───────────── state ───────────── */
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // add | edit | view
  const [selectedStory, setSelectedStory] = useState(null);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const [loadingStates, setLoadingStates] = useState({
    fetching: false,
    creating: false,
    updating: false,
    deleting: {},
  });

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    date: "",
    location: "",
    mainImage: "",
    story: "",
    author: "",
    featured: false,
    status: "published",
    metaTitle: "",
    metaDescription: "",
    isActive: true,
  });

  const { state } = useSidebar();

  /* ───────────── first load ───────────── */
  useEffect(() => {
    const abort = new AbortController();
    fetchStories(abort.signal);
    fetchCategories(abort.signal);
    return () => abort.abort();
  }, []);

  /* ───────────── helpers ───────────── */
  const fetchStories = async (signal) => {
    try {
      setLoadingStates((p) => ({ ...p, fetching: true }));
      setLoading(true);

      const res = await axiosInstance.get("/featured/stories", {
        signal,
        params: { status: "all", sortBy: "createdAt", sortOrder: "desc" },
      });

      const { stories: list, totalCount, hasMore } = res.data;
      setStories(list || []);
      setTotalCount(totalCount || 0);
      setHasMore(hasMore || false);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching stories:", err);
        toast.error(err.response?.data?.message || "Failed to load stories");
      }
    } finally {
      setLoadingStates((p) => ({ ...p, fetching: false }));
      setLoading(false);
    }
  };

  const fetchCategories = async (signal) => {
    try {
      setCatLoading(true);
      const { data } = await axiosInstance.get("/services/get-services", {
        signal,
      });
      const names = [
        ...new Set(
          (data || [])
            .map((s) => s.name)
            .filter(Boolean)
        ),
      ];
      setCategories(names);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching categories:", err);
        toast.error("Failed to load categories");
      }
    } finally {
      setCatLoading(false);
    }
  };

  const handleImageUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setUploadingImage(true);
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
    setSelectedFile(file);
    setUploadingImage(false);
  };

  const handleRemoveImage = () => {
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setSelectedFile(null);
    setFormData((p) => ({ ...p, mainImage: "" }));
  };

  /* ───────── dialog open helpers ───────── */
  const handleAdd = () => {
    if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
    setDialogMode("add");
    setSelectedStory(null);
    setFormData({
      title: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
      location: "",
      mainImage: "",
      story: "",
      author: "",
      featured: false,
      status: "published",
      metaTitle: "",
      metaDescription: "",
      isActive: true,
    });
    setImagePreview(null);
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const openStory = (story, mode) => {
    const dateForInput = story.date
      ? story.date.includes("-")
        ? story.date
        : new Date(story.createdAt).toISOString().split("T")[0]
      : new Date(story.createdAt).toISOString().split("T")[0];

    setDialogMode(mode);
    setSelectedStory(story);
    setFormData({
      ...story,
      date: dateForInput,
      metaTitle: story.metaTitle || "",
      metaDescription: story.metaDescription || "",
      isActive: story.isActive !== undefined ? story.isActive : true,
    });
    setImagePreview(story.mainImage || null);
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      setLoadingStates((p) => ({
        ...p,
        deleting: { ...p.deleting, [id]: true },
      }));
      await axiosInstance.delete(`/featured/stories/${id}`);
      setStories((prev) => prev.filter((s) => s.id !== id));
      setTotalCount((p) => p - 1);
      toast.success("Story deleted successfully");
    } catch (err) {
      console.error("Error deleting story:", err);
      toast.error(err.response?.data?.message || "Failed to delete story");
    } finally {
      setLoadingStates((p) => ({
        ...p,
        deleting: { ...p.deleting, [id]: false },
      }));
    }
  };

  const handleSave = async () => {
    // validation
    if (!formData.title.trim()) return toast.error("Story title is required");
    if (!formData.category.trim()) return toast.error("Category is required");
    if (!formData.story.trim()) return toast.error("Story content is required");
    if (!formData.author.trim()) return toast.error("Author is required");
    if (dialogMode === "add" && !selectedFile)
      return toast.error("Please select an image file");

    try {
      if (dialogMode === "add") {
        setLoadingStates((p) => ({ ...p, creating: true }));
        const fd = buildFormData(formData, selectedFile);
        const res = await axiosInstance.post("/featured/stories/create", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setStories((p) => [res.data, ...p]);
        setTotalCount((p) => p + 1);
        toast.success("Story added successfully");
      } else if (dialogMode === "edit") {
        setLoadingStates((p) => ({ ...p, updating: true }));
        const fd = buildFormData(formData, selectedFile);
        const res = await axiosInstance.put(
          `/featured/stories/${selectedStory.id}`,
          fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        setStories((p) =>
          p.map((s) => (s.id === selectedStory.id ? res.data : s))
        );
        toast.success("Story updated successfully");
      }
      setDialogOpen(false);
    } catch (err) {
      console.error("Error saving story:", err);
      toast.error(err.response?.data?.message || "Failed to save story");
    } finally {
      setLoadingStates((p) => ({
        ...p,
        creating: false,
        updating: false,
      }));
    }
  };

  const buildFormData = (obj, file) => {
    const fd = new FormData();
    Object.entries({
      title: obj.title,
      category: obj.category,
      date: obj.date,
      location: obj.location,
      story: obj.story,
      author: obj.author,
      featured: obj.featured,
      status: obj.status,
      metaTitle: obj.metaTitle,
      metaDescription: obj.metaDescription,
      isActive: obj.isActive,
    }).forEach(([k, v]) => fd.append(k, v));
    if (file) fd.append("image", file);
    return fd;
  };

  const handleInputChange = (field, value) =>
    setFormData((p) => ({ ...p, [field]: value }));

  /* ───────── table columns ───────── */
  const columns = [
    {
      accessorKey: "mainImage",
      header: "Image",
      size: 80,
      cell: ({ getValue }) => (
        <Avatar className="h-16 w-16 rounded-lg">
          <AvatarImage
            src={getValue() || ""}
            alt="Story"
            className="object-cover"
          />
          <AvatarFallback className="rounded-lg bg-gray-100">
            <ImageIcon className="h-6 w-6 text-gray-400" />
          </AvatarFallback>
        </Avatar>
      ),
    },
    {
      accessorKey: "title",
      header: "Story Details",
      cell: ({ getValue, row }) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <p className="font-medium text-sm">{getValue()}</p>
            {row.original.featured && (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            )}
            {!row.original.isActive && (
              <Badge variant="secondary" className="text-xs">
                Inactive
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {row.original.author}
          </p>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{row.original.location || "No location"}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-xs">
          {getValue()}
        </Badge>
      ),
    },
    {
      accessorKey: "story",
      header: "Story Preview",
      size: 300,
      cell: ({ getValue }) => (
        <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
          {getValue()}
        </p>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => (
        <Badge
          variant={getValue() === "published" ? "default" : "secondary"}
          className="text-xs"
        >
          {getValue()}
        </Badge>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      size: 120,
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(getValue()).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 120,
      cell: ({ row }) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openStory(row.original, "view")}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openStory(row.original, "edit")}
            className="h-8 w-8 p-0"
            disabled={loadingStates.updating}
          >
            {loadingStates.updating ? (
              <div className="animate-spin h-4 w-4 border-b-2 border-gray-500 rounded-full" />
            ) : (
              <Edit className="h-4 w-4" />
            )}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                disabled={loadingStates.deleting[row.original.id]}
              >
                {loadingStates.deleting[row.original.id] ? (
                  <div className="animate-spin h-4 w-4 border-b-2 border-red-500 rounded-full" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{row.original.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(row.original.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  /* ───────── stats ───────── */
  const totalViews = stories.reduce((a, s) => a + (s.views || 0), 0);
  const totalLikes = stories.reduce((a, s) => a + (s.likes || 0), 0);
  const featuredStories = stories.filter((s) => s.featured).length;
  const activeStories = stories.filter((s) => s.isActive !== false).length;

  /* ───────── layout helpers ───────── */
  const getSpacing = () =>
    state === "expanded" ? "p-4 space-y-4" : "p-6 space-y-6";
  const getContainerClass = () =>
    state === "expanded" ? "max-w-none mx-2" : "container mx-auto";

  /* ───────── render ───────── */
  return (
    <div className={`${getContainerClass()} ${getSpacing()}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Featured Stories
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Manage client stories and showcase your photography journey
          </p>
        </div>
        <Button
          onClick={handleAdd}
          className="w-fit"
          disabled={loadingStates.creating}
        >
          {loadingStates.creating ? (
            <>
              <div className="animate-spin h-4 w-4 border-b-2 border-white mr-2 rounded-full" />
              Creating…
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Add New Story
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 lg:gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCount || stories.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeStories} active • {stories.length - activeStories} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featuredStories}</div>
            <p className="text-xs text-muted-foreground">
              Highlighted stories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalViews.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Story views</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLikes}</div>
            <p className="text-xs text-muted-foreground">Story likes</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className={state === "expanded" ? "pb-4" : ""}>
          <CardTitle className="text-lg lg:text-xl">All Stories</CardTitle>
          <CardDescription>
            Manage and showcase your photography stories
            {hasMore && (
              <span className="ml-2 text-xs">
                (Showing {stories.length} of {totalCount})
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className={state === "expanded" ? "p-4" : ""}>
          <DataTable
            data={stories}
            columns={columns}
            loading={loading}
            enableSorting
            enableFiltering
            enablePagination
            pageSize={8}
            emptyMessage="No stories found"
            className="border-0"
          />
        </CardContent>
      </Card>

      {/* Story Dialog */}
      <StoryDialog />
    </div>
  );

  /* ───────── internal components ───────── */
  function StoryDialog() {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add"
                ? "Add New Story"
                : dialogMode === "edit"
                ? "Edit Story"
                : "Story Details"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "add"
                ? "Create a new client story to showcase your photography work."
                : dialogMode === "edit"
                ? "Update the story details and content."
                : "View the complete story information."}
            </DialogDescription>
          </DialogHeader>

          {/* Form */}
          <div className="grid gap-4 py-4">
            {/* Title */}
            <FormRow label="Title *" id="title">
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                disabled={dialogMode === "view"}
                placeholder="Enter story title"
              />
            </FormRow>

            {/* Category */}
            <FormRow label="Category *" id="category">
              {dialogMode === "view" ? (
                <Input value={formData.category} disabled />
              ) : (
                <CategorySelect />
              )}
            </FormRow>

            {/* Date */}
            <FormRow label="Date" id="date">
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                disabled={dialogMode === "view"}
              />
            </FormRow>

            {/* Location */}
            <FormRow label="Location" id="location">
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                disabled={dialogMode === "view"}
                placeholder="Enter location"
              />
            </FormRow>

            {/* Author */}
            <FormRow label="Author *" id="author">
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => handleInputChange("author", e.target.value)}
                disabled={dialogMode === "view"}
                placeholder="Enter author name"
              />
            </FormRow>

            {/* Meta Title */}
            <FormRow label="Meta Title" id="metaTitle">
              <Input
                id="metaTitle"
                value={formData.metaTitle}
                onChange={(e) => handleInputChange("metaTitle", e.target.value)}
                disabled={dialogMode === "view"}
                placeholder="SEO meta title"
              />
            </FormRow>

            {/* Meta Description */}
            <FormRow label="Meta Description" id="metaDescription" textarea>
              <Textarea
                id="metaDescription"
                value={formData.metaDescription}
                onChange={(e) =>
                  handleInputChange("metaDescription", e.target.value)
                }
                disabled={dialogMode === "view"}
                placeholder="SEO meta description"
                rows={3}
              />
            </FormRow>

            {/* Image */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Image *</Label>
              <div className="col-span-3">
                <ImageUploadSection
                  preview={imagePreview}
                  isUploading={uploadingImage}
                />
              </div>
            </div>

            {/* Story */}
            <FormRow label="Story *" id="story" textarea>
              <Textarea
                id="story"
                value={formData.story}
                onChange={(e) => handleInputChange("story", e.target.value)}
                disabled={dialogMode === "view"}
                placeholder="Write the story content…"
                rows={6}
              />
            </FormRow>

            {/* Status */}
            <FormRow label="Status" id="status">
              {dialogMode === "view" ? (
                <Input value={formData.status} disabled />
              ) : (
                <Select
                  value={formData.status}
                  onValueChange={(v) => handleInputChange("status", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FormRow>

            {/* Toggles */}
            {dialogMode !== "view" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Options</Label>
                <div className="col-span-3 space-y-3">
                  <ToggleRow
                    id="featured"
                    label="Mark as featured story"
                    checked={formData.featured}
                    onChange={(v) => handleInputChange("featured", v)}
                  />
                  <ToggleRow
                    id="isActive"
                    label="Story is active"
                    checked={formData.isActive}
                    onChange={(v) => handleInputChange("isActive", v)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {dialogMode === "view" ? "Close" : "Cancel"}
            </Button>
            {dialogMode !== "view" && (
              <Button
                onClick={handleSave}
                disabled={loadingStates.creating || loadingStates.updating}
              >
                {loadingStates.creating || loadingStates.updating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-b-2 border-white mr-2 rounded-full" />
                    {dialogMode === "add" ? "Adding…" : "Saving…"}
                  </>
                ) : dialogMode === "add" ? (
                  "Add Story"
                ) : (
                  "Save Changes"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  /* small helpers */
  function FormRow({ label, id, children, textarea }) {
    return (
      <div
        className={`grid grid-cols-4 items-${
          textarea ? "start" : "center"
        } gap-4`}
      >
        <Label htmlFor={id} className={`text-right ${textarea ? "pt-2" : ""}`}>
          {label}
        </Label>
        <div className="col-span-3">{children}</div>
      </div>
    );
  }

  function CategorySelect() {
    return (
      <Select
        value={formData.category}
        onValueChange={(v) => handleInputChange("category", v)}
        disabled={catLoading}
      >
        <SelectTrigger>
          <SelectValue placeholder={catLoading ? "Loading…" : "Select category"} />
        </SelectTrigger>
        <SelectContent>
          {categories.map((name) => (
            <SelectItem key={name} value={name}>
              {name}
            </SelectItem>
          ))}
          {newCategory && !categories.includes(newCategory) && (
            <SelectItem key="new" value={newCategory}>
              {newCategory}
            </SelectItem>
          )}
          <div className="p-2 border-t">
            <Input
              placeholder="New category…"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onBlur={() => {
                if (newCategory) {
                  setCategories((p) => [...p, newCategory]);
                  handleInputChange("category", newCategory);
                }
              }}
              className="h-8 text-xs"
            />
          </div>
        </SelectContent>
      </Select>
    );
  }

  function ToggleRow({ id, label, checked, onChange }) {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4"
        />
        <Label htmlFor={id} className="text-sm">
          {label}
        </Label>
      </div>
    );
  }

  function ImageUploadSection({ preview, isUploading }) {
    return (
      <div className="space-y-3">
        <Label>Story Image *</Label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          {preview ? (
            <div className="relative">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  e.target.src =
                    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCB3aWR0aD0nMTAwJyBoZWlnaHQ9JzEwMCcgcng9JzUnIGZpbGw9IiNlZWUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgc3R5bGU9ImZvbnQtc2l6ZToxMXB4OyI+SW1hZ2Ugbm90IGZvdW5kPC90ZXh0Pjwvc3ZnPg==";
                  e.target.onerror = null;
                }}
              />
              {dialogMode !== "view" && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-400">
                PNG, JPG, JPEG up to 10MB
              </p>
            </div>
          )}
        </div>
        {dialogMode !== "view" && (
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e.target.files[0])}
            disabled={isUploading}
            className="cursor-pointer"
          />
        )}
        {isUploading && (
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="animate-spin h-4 w-4 border-b-2 border-gray-900 rounded-full" />
            <span>Processing…</span>
          </div>
        )}
      </div>
    );
  }
};

export default FeaturedStoriesPage;
