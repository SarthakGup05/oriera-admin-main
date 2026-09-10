import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Send,
  Eye,
  Edit3,
  Image as ImageIcon,
  Upload,
  X,
  Plus,
  Sparkles,
  Search,
  Globe,
  Tag,
  Folder,
  User,
  Calendar,
  Clock,
  Check,
  Loader2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TipTapEditor from "@/components/blog/TipTapEditor";
import { toast } from "react-hot-toast";
import axiosInstance from "@/lib/axiosinstaance";

export default function BlogEditorPage() {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("write"); // write | preview

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "Photography",
    tags: ["Wedding", "Moments"],
    author: "Jaya Photography",
    featured: false,
    status: "published", // "draft" | "published"
    isActive: true,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    publishedAt: new Date().toISOString().split("T")[0],
    coverImage: "",
  });

  // Cover image upload state
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const coverInputRef = useRef(null);

  // Tag input state
  const [tagInput, setTagInput] = useState("");

  // Categories list
  const [categories, setCategories] = useState([
    "Photography",
    "Wedding",
    "Pre-Wedding",
    "Maternity",
    "Baby Shoot",
    "Fashion",
    "Portraits",
    "Behind The Scenes",
    "Tips & Stories",
  ]);
  const [newCatInput, setNewCatInput] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);

  // Auto-slug control
  const [isSlugManual, setIsSlugManual] = useState(false);

  // Load existing blog if editing
  useEffect(() => {
    if (isEditMode) {
      fetchBlogDetails();
    }
    fetchCategories();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/blogs/categories");
      if (res.data?.categories && res.data.categories.length > 0) {
        setCategories((prev) => [
          ...new Set([...prev, ...res.data.categories]),
        ]);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const fetchBlogDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/blogs/${id}`);
      if (res.data?.blog) {
        const b = res.data.blog;
        setFormData({
          title: b.title || "",
          slug: b.slug || "",
          excerpt: b.excerpt || "",
          content: b.content || "",
          category: b.category || "Photography",
          tags: Array.isArray(b.tags) ? b.tags : [],
          author: b.author || "Jaya Photography",
          featured: Boolean(b.featured),
          status: b.status || "published",
          isActive: b.isActive !== undefined ? b.isActive : true,
          metaTitle: b.metaTitle || "",
          metaDescription: b.metaDescription || "",
          metaKeywords: b.metaKeywords || "",
          publishedAt: b.publishedAt
            ? new Date(b.publishedAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          coverImage: b.coverImage || "",
        });
        if (b.coverImage) {
          setCoverPreview(b.coverImage);
        }
        setIsSlugManual(true);
      }
    } catch (err) {
      console.error("Error fetching blog:", err);
      toast.error("Failed to load blog post details");
      navigate("/blogs");
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from title if not manually customized
  const handleTitleChange = (val) => {
    setFormData((prev) => {
      const updated = { ...prev, title: val };
      if (!isSlugManual) {
        updated.slug = slugify(val);
      }
      if (!prev.metaTitle) {
        updated.metaTitle = val;
      }
      return updated;
    });
  };

  const slugify = (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/&/g, "-and-")
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // Handle Cover Image selection
  const handleCoverSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size must be less than 10MB");
      return;
    }

    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    setFormData((prev) => ({ ...prev, coverImage: "" }));
  };

  // Tag Handlers
  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, "");
    if (!trimmed) return;
    if (formData.tags.includes(trimmed)) {
      setTagInput("");
      return;
    }
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  // Add custom category
  const handleAddCategory = () => {
    if (!newCatInput.trim()) return;
    const cat = newCatInput.trim();
    if (!categories.includes(cat)) {
      setCategories((prev) => [...prev, cat]);
    }
    setFormData((prev) => ({ ...prev, category: cat }));
    setNewCatInput("");
    setShowNewCat(false);
  };

  // Save / Publish
  const handleSave = async (overrideStatus = null) => {
    const finalStatus = overrideStatus || formData.status;

    if (!formData.title.trim()) {
      toast.error("Please provide a title for your blog post");
      return;
    }
    if (!formData.content.trim() || formData.content === "<p></p>") {
      toast.error("Please write some content in the editor");
      return;
    }

    try {
      setSaving(true);

      const postData = new FormData();
      postData.append("title", formData.title.trim());
      postData.append("slug", formData.slug.trim() || slugify(formData.title));
      postData.append("excerpt", formData.excerpt.trim());
      postData.append("content", formData.content);
      postData.append("category", formData.category);
      postData.append("tags", JSON.stringify(formData.tags));
      postData.append("author", formData.author.trim());
      postData.append("featured", formData.featured);
      postData.append("status", finalStatus);
      postData.append("isActive", formData.isActive);
      postData.append("metaTitle", formData.metaTitle.trim() || formData.title.trim());
      postData.append("metaDescription", formData.metaDescription.trim() || formData.excerpt.trim());
      postData.append("metaKeywords", formData.metaKeywords.trim());
      postData.append("publishedAt", formData.publishedAt);

      if (coverFile) {
        postData.append("coverImage", coverFile);
      } else if (!coverPreview) {
        postData.append("removeCoverImage", "true");
      }

      let res;
      if (isEditMode) {
        res = await axiosInstance.put(`/blogs/${id}`, postData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(
          finalStatus === "published"
            ? "Article published successfully!"
            : "Draft saved successfully!"
        );
      } else {
        res = await axiosInstance.post("/blogs/create", postData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(
          finalStatus === "published"
            ? "Story published live!"
            : "Draft saved!"
        );
      }

      navigate("/blogs");
    } catch (err) {
      console.error("Save error:", err);
      toast.error(err.response?.data?.message || "Failed to save blog post");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">
          Loading article studio...
        </p>
      </div>
    );
  }

  // Reading time helper
  const wordCount = formData.content
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const readTimeEst = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Top Action Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20 bg-background/90 backdrop-blur-md py-3 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/blogs")}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Articles
          </Button>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
            {isEditMode ? "Editing Post" : "Draft Studio"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Write vs Preview Mode Toggle */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-auto mr-2"
          >
            <TabsList className="h-9">
              <TabsTrigger value="write" className="gap-1.5 text-xs">
                <Edit3 className="w-3.5 h-3.5" /> Editor
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-1.5 text-xs">
                <Eye className="w-3.5 h-3.5" /> Live Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="gap-1.5 text-xs"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </Button>

          <Button
            onClick={() => handleSave("published")}
            disabled={saving}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {isEditMode ? "Update & Publish" : "Publish Live"}
          </Button>
        </div>
      </div>

      {/* ── Main 2-Column Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ════ LEFT / MAIN WRITING AREA (2 cols) ════ */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "write" ? (
            <>
              {/* Title & Slug Box */}
              <Card className="shadow-xs border-border/80">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label htmlFor="post-title" className="text-sm font-semibold">
                      Article Title *
                    </Label>
                    <Input
                      id="post-title"
                      placeholder="e.g., Magical Sunset Destination Wedding in Udaipur..."
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="text-xl font-bold mt-1.5 h-12 tracking-tight"
                    />
                  </div>

                  {/* Slug preview & editor */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/60">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-mono">/blog/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => {
                        setIsSlugManual(true);
                        setFormData((p) => ({
                          ...p,
                          slug: slugify(e.target.value),
                        }));
                      }}
                      className="bg-transparent font-mono text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary rounded px-1.5 py-0.5 border border-transparent hover:border-border transition-colors max-w-sm"
                      placeholder="custom-post-slug"
                    />
                    <span className="text-[10px] text-muted-foreground ml-auto hidden sm:inline">
                      (Auto-generated slug)
                    </span>
                  </div>

                  {/* Short Excerpt */}
                  <div>
                    <Label htmlFor="post-excerpt" className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                      <span>Short Excerpt / Story Summary</span>
                      <span className="text-[11px]">{formData.excerpt.length}/200 chars</span>
                    </Label>
                    <Textarea
                      id="post-excerpt"
                      placeholder="A short engaging teaser describing the highlights of this article or photoshoot..."
                      value={formData.excerpt}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, excerpt: e.target.value }))
                      }
                      rows={2}
                      className="mt-1.5 text-sm resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Rich Text TipTap Studio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-primary" />
                    Article Story & Content *
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    ~{readTimeEst} min read ({wordCount} words)
                  </span>
                </div>

                <TipTapEditor
                  value={formData.content}
                  onChange={(html) =>
                    setFormData((prev) => ({ ...prev, content: html }))
                  }
                  placeholder="Begin writing your photography story, memories, tips, or highlights here. Click the Image or Link icons in the toolbar to embed rich media..."
                  minHeight="450px"
                />
              </div>
            </>
          ) : (
            /* ════ LIVE ARTICLE PREVIEW TAB ════ */
            <Card className="shadow-xs border-border/80 overflow-hidden bg-background">
              <div className="p-8 max-w-3xl mx-auto space-y-6">
                {/* Category & Date */}
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="font-semibold">
                    {formData.category}
                  </Badge>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {readTimeEst} min read
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {new Date(formData.publishedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  {formData.title || "Untitled Blog Post"}
                </h1>

                {/* Author Info */}
                <div className="flex items-center gap-3 py-2 border-y border-border/60">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {formData.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {formData.author}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Official Photographer & Storyteller
                    </p>
                  </div>
                </div>

                {/* Cover Image */}
                {coverPreview && (
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-border/60 max-h-[420px]">
                    <img
                      src={coverPreview}
                      alt={formData.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Excerpt */}
                {formData.excerpt && (
                  <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4 py-1 leading-relaxed">
                    {formData.excerpt}
                  </p>
                )}

                {/* Rich HTML Content */}
                <div
                  className="prose dark:prose-invert max-w-none text-foreground py-4 text-base leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html:
                      formData.content ||
                      "<p className='text-muted-foreground italic'>No content written yet...</p>",
                  }}
                />

                {/* Tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-6 border-t border-border/60">
                    {formData.tags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* ════ RIGHT / SETTINGS SIDEBAR (1 col) ════ */}
        <div className="space-y-6">
          {/* 1. Publishing Status & Options */}
          <Card className="shadow-xs border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-primary" />
                Publishing Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) =>
                    setFormData((p) => ({ ...p, status: val }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published (Live)</SelectItem>
                    <SelectItem value="draft">Draft (Private)</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Publish Date */}
              <div>
                <Label className="text-xs text-muted-foreground">
                  Publish Date
                </Label>
                <Input
                  type="date"
                  value={formData.publishedAt}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, publishedAt: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold cursor-pointer">
                      Featured Story
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Highlight on home and blog hero
                    </p>
                  </div>
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(val) =>
                      setFormData((p) => ({ ...p, featured: val }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold cursor-pointer">
                      Active
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Visible in public queries
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(val) =>
                      setFormData((p) => ({ ...p, isActive: val }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Cover Image Card */}
          <Card className="shadow-xs border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                Featured Cover Image
              </CardTitle>
              <CardDescription className="text-xs">
                Recommended aspect ratio: 16:9 (1200 x 675px)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {coverPreview ? (
                <div className="relative group rounded-xl overflow-hidden border border-border/60 bg-muted/20 aspect-video shadow-xs">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => coverInputRef.current?.click()}
                      className="text-xs gap-1"
                    >
                      <Upload className="w-3.5 h-3.5" /> Replace
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={handleRemoveCover}
                      className="text-xs gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-6 text-center cursor-pointer transition-colors bg-muted/10 hover:bg-muted/30 flex flex-col items-center justify-center gap-2 aspect-video"
                >
                  <div className="p-2.5 rounded-full bg-primary/10 text-primary">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">
                    Click or drag image to upload
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    JPG, PNG, WebP up to 10MB
                  </p>
                </div>
              )}

              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleCoverSelect(e.target.files[0]);
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* 3. Category & Tags */}
          <Card className="shadow-xs border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Folder className="w-4 h-4 text-primary" />
                Category & Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category */}
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                {!showNewCat ? (
                  <div className="flex gap-2 mt-1">
                    <Select
                      value={formData.category}
                      onValueChange={(val) =>
                        setFormData((p) => ({ ...p, category: val }))
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setShowNewCat(true)}
                      title="Add Custom Category"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="New category..."
                      value={newCatInput}
                      onChange={(e) => setNewCatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCategory();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCategory}
                      className="px-3"
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewCat(false)}
                      className="px-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <Label className="text-xs text-muted-foreground">
                  Tags (Press Enter to add)
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="e.g. DestinationWedding, Candid"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddTag}
                  >
                    Add
                  </Button>
                </div>

                {/* Tag Pills */}
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border/70"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Author */}
              <div>
                <Label className="text-xs text-muted-foreground">Author</Label>
                <Input
                  value={formData.author}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, author: e.target.value }))
                  }
                  placeholder="Author name"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* 4. SEO & Social Meta Card */}
          <Card className="shadow-xs border-border/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                SEO & Google Search Preview
              </CardTitle>
              <CardDescription className="text-xs">
                Optimize search rankings and social media shares
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Meta Title */}
              <div>
                <Label className="text-xs text-muted-foreground flex justify-between">
                  <span>Meta Title</span>
                  <span className="text-[10px]">
                    {formData.metaTitle.length}/60 chars
                  </span>
                </Label>
                <Input
                  value={formData.metaTitle}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, metaTitle: e.target.value }))
                  }
                  placeholder="SEO optimized headline"
                  className="mt-1 text-xs"
                />
              </div>

              {/* Meta Description */}
              <div>
                <Label className="text-xs text-muted-foreground flex justify-between">
                  <span>Meta Description</span>
                  <span className="text-[10px]">
                    {formData.metaDescription.length}/160 chars
                  </span>
                </Label>
                <Textarea
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      metaDescription: e.target.value,
                    }))
                  }
                  placeholder="Brief summary appearing in Google search results..."
                  rows={2}
                  className="mt-1 text-xs resize-none"
                />
              </div>

              {/* Google SERP Snippet Preview Mockup */}
              <div className="p-3 bg-muted/40 rounded-xl border border-border/70 space-y-1">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-500" /> Google Search Result
                </p>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400 truncate hover:underline cursor-pointer">
                  {formData.metaTitle || formData.title || "Your Blog Post Title"} - Jaya Photography
                </p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-500 truncate font-mono">
                  https://jayaphotography.in/blog/{formData.slug || "your-post-slug"}
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {formData.metaDescription ||
                    formData.excerpt ||
                    "Read our latest photography story and client experiences captured by Jaya Photography."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
