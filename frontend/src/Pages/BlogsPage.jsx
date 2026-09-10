import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Star,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  BookOpen,
  Filter,
  Layers,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import axiosInstance from "@/lib/axiosinstaance";

export default function BlogsPage() {
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    totalViews: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [categories, setCategories] = useState([]);

  // Quick Preview Dialog
  const [previewBlog, setPreviewBlog] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [pagination.page, selectedCategory, selectedStatus]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchBlogs();
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchStats = async () => {
    try {
      const res = await axiosInstance.get("/blogs/stats");
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error("Error loading blog stats:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get("/blogs/categories");
      if (res.data?.categories) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
      };

      const res = await axiosInstance.get("/blogs", { params });
      if (res.data?.blogs) {
        setBlogs(res.data.blogs);
        if (res.data.pagination) {
          setPagination((prev) => ({
            ...prev,
            total: res.data.pagination.total,
            totalPages: res.data.pagination.totalPages,
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching blogs:", err);
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (blog) => {
    const nextStatus = blog.status === "published" ? "draft" : "published";
    try {
      // Optimistic update
      setBlogs((prev) =>
        prev.map((b) => (b.id === blog.id ? { ...b, status: nextStatus } : b))
      );

      await axiosInstance.patch(`/blogs/${blog.id}/status`, {
        status: nextStatus,
      });

      toast.success(
        nextStatus === "published" ? "Post published!" : "Post moved to drafts"
      );
      fetchStats();
    } catch (err) {
      // Revert on error
      setBlogs((prev) =>
        prev.map((b) => (b.id === blog.id ? { ...b, status: blog.status } : b))
      );
      toast.error("Failed to update status");
    }
  };

  const handleToggleFeatured = async (blog) => {
    const nextFeatured = !blog.featured;
    try {
      setBlogs((prev) =>
        prev.map((b) => (b.id === blog.id ? { ...b, featured: nextFeatured } : b))
      );

      await axiosInstance.patch(`/blogs/${blog.id}/featured`);
      toast.success(
        nextFeatured ? "Marked as featured" : "Removed from featured"
      );
    } catch (err) {
      setBlogs((prev) =>
        prev.map((b) => (b.id === blog.id ? { ...b, featured: blog.featured } : b))
      );
      toast.error("Failed to update featured flag");
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await axiosInstance.delete(`/blogs/${id}`);
      setBlogs((prev) => prev.filter((b) => b.id !== id));
      toast.success("Blog post deleted successfully");
      fetchStats();
    } catch (err) {
      console.error("Failed to delete blog:", err);
      toast.error("Failed to delete blog post");
    } finally {
      setDeletingId(null);
    }
  };

  const openPreview = (blog) => {
    setPreviewBlog(blog);
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <BookOpen className="w-8 h-8 text-primary" />
            Blog & Article Studio
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create, publish, and manage engaging stories, photo highlights, and articles.
          </p>
        </div>

        <Button
          onClick={() => navigate("/blogs/new")}
          className="shadow-sm gap-2 font-medium"
        >
          <Plus className="w-4 h-4" />
          Write New Story
        </Button>
      </div>

      {/* ── Stat Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Articles
            </CardTitle>
            <FileText className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.published} published • {stats.draft} drafts
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Published
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.published}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Live on website
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Drafts
            </CardTitle>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {stats.draft}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unpublished work
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Reads & Views
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(stats.totalViews || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cumulative readers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Filters & Search ── */}
      <Card className="shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search title, content, author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px] bg-background">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Blog Posts Table / Cards ── */}
      <Card className="shadow-xs overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              All Articles ({pagination.total})
            </CardTitle>
            {loading && (
              <span className="text-xs text-muted-foreground animate-pulse">
                Updating list...
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading && blogs.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading articles...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="py-16 px-4 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  No articles found
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                  {searchTerm || selectedCategory !== "all" || selectedStatus !== "all"
                    ? "Try adjusting your search filters to find what you're looking for."
                    : "Get started by publishing your first blog post or photography story."}
                </p>
              </div>
              <Button onClick={() => navigate("/blogs/new")} className="gap-2">
                <Plus className="w-4 h-4" /> Write First Story
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {blogs.map((blog) => (
                <div
                  key={blog.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Cover Thumbnail */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0 border border-border/60 bg-muted/40 shadow-xs">
                      {blog.coverImage ? (
                        <img
                          src={blog.coverImage}
                          alt={blog.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="w-7 h-7" />
                        </div>
                      )}
                      {blog.featured && (
                        <div
                          title="Featured Article"
                          className="absolute top-1 right-1 p-1 bg-amber-500 text-white rounded-full shadow-xs"
                        >
                          <Star className="w-3 h-3 fill-current" />
                        </div>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="text-xs font-medium bg-primary/10 text-primary border-primary/20"
                        >
                          {blog.category || "General"}
                        </Badge>
                        <Badge
                          variant={blog.status === "published" ? "default" : "outline"}
                          className={`text-xs ${
                            blog.status === "published"
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "text-amber-600 border-amber-400/50 dark:text-amber-400"
                          }`}
                        >
                          {blog.status === "published" ? "Published" : "Draft"}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {blog.readTime || "2 min read"}
                        </span>
                      </div>

                      <h3
                        onClick={() => navigate(`/blogs/edit/${blog.id}`)}
                        className="text-base font-semibold text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                      >
                        {blog.title}
                      </h3>

                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {blog.excerpt || "No excerpt provided."}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                        <span>By <strong className="text-foreground">{blog.author || "Admin"}</strong></span>
                        <span>•</span>
                        <span>
                          {blog.publishedAt
                            ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "Not published"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-medium">
                          <Eye className="w-3.5 h-3.5" /> {(blog.views || 0).toLocaleString()} views
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Controls & Actions */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-0 border-border/60">
                    {/* Quick status toggle */}
                    <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-lg border border-border/60">
                      <span className="text-xs font-medium text-muted-foreground">
                        {blog.status === "published" ? "Live" : "Draft"}
                      </span>
                      <Switch
                        checked={blog.status === "published"}
                        onCheckedChange={() => handleToggleStatus(blog)}
                      />
                    </div>

                    {/* Featured toggle */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFeatured(blog)}
                      className={`h-9 w-9 ${
                        blog.featured
                          ? "text-amber-500 hover:text-amber-600 bg-amber-500/10"
                          : "text-muted-foreground hover:text-amber-500"
                      }`}
                      title={blog.featured ? "Unfeature" : "Mark as Featured"}
                    >
                      <Star className={`w-4 h-4 ${blog.featured ? "fill-current" : ""}`} />
                    </Button>

                    {/* View Preview */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openPreview(blog)}
                      className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      title="Quick Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {/* Edit */}
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/blogs/edit/${blog.id}`)}
                      className="h-9 w-9 text-primary hover:bg-primary/10"
                      title="Edit Article"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    {/* Delete */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={deletingId === blog.id}
                          className="h-9 w-9 text-destructive hover:bg-destructive/10"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this article?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to permanently delete{" "}
                            <strong>"{blog.title}"</strong>? This will also remove the cover image from Cloudinary.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(blog.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete Permanently
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Preview Dialog Modal ── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[750px] max-h-[85vh] overflow-y-auto">
          {previewBlog && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{previewBlog.category}</Badge>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {previewBlog.readTime || "3 min read"}
                  </span>
                </div>
                <DialogTitle className="text-2xl font-bold leading-tight">
                  {previewBlog.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground pt-1">
                  By {previewBlog.author} • Published on{" "}
                  {new Date(previewBlog.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </DialogDescription>
              </DialogHeader>

              {previewBlog.coverImage && (
                <div className="rounded-xl overflow-hidden max-h-[350px] border border-border">
                  <img
                    src={previewBlog.coverImage}
                    alt={previewBlog.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {previewBlog.excerpt && (
                <p className="text-base text-muted-foreground italic border-l-4 border-primary pl-4 py-1">
                  {previewBlog.excerpt}
                </p>
              )}

              {/* Rich Content View */}
              <div
                className="prose dark:prose-invert max-w-none text-foreground py-2"
                dangerouslySetInnerHTML={{ __html: previewBlog.content }}
              />

              {previewBlog.tags && previewBlog.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-border">
                  {previewBlog.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
