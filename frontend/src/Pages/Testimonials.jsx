// pages/TestimonialsPage.jsx
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
  Star, 
  Eye, 
  Trash2, 
  MessageSquare, 
  X, 
  MapPin, 
  Calendar, 
  Activity,
  TrendingUp,
  Users,
  Loader2
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import useTestimonialsStore from "@/store/useTestimonialsStore";

const TestimonialsPage = () => {
  // Zustand store selectors
  const {
    // State
    testimonials,
    loading,
    isViewModalOpen,
    selectedTestimonial,
    toggleLoading,
    pagination,
    
    // Actions
    fetchTestimonials,
    toggleTestimonialStatus,
    deleteTestimonial,
    openViewModal,
    closeViewModal,
    
    // Utilities
    truncateText,
    formatDate,
    
    // Computed
    getStats
  } = useTestimonialsStore();

  // Get computed stats
  const stats = getStats();

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  // Column definitions with enhanced features
  const columns = [
    {
      accessorKey: "image",
      header: "Client",
      size: 80,
      cell: ({ getValue, row }) => (
        <div className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={getValue()} alt="Client" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              {row.original.name?.charAt(0)?.toUpperCase() || 'C'}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1">
            <div className="bg-blue-500 text-white rounded-full p-1 shadow-sm">
              <MessageSquare className="h-3 w-3" />
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Client Info",
      cell: ({ getValue, row }) => (
        <div className="space-y-1">
          <p className="font-medium text-sm">{getValue()}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {row.original.location || 'Location not specified'}
          </p>
          <div className="flex items-center gap-2">
            <Badge 
              variant={row.original.isActive ? "default" : "secondary"} 
              className="text-xs"
            >
              {row.original.isActive ? "Published" : "Pending"}
            </Badge>
            {row.original.featured && (
              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                ⭐ Featured
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "service",
      header: "Service",
      cell: ({ getValue }) => (
        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          {getValue()}
        </Badge>
      ),
    },
    {
      accessorKey: "rating",
      header: "Rating",
      size: 120,
      cell: ({ getValue }) => (
        <div className="flex items-center space-x-1">
          <div className="flex">
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                className={`h-4 w-4 ${
                  index < getValue()
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {getValue()}/5
          </span>
        </div>
      ),
    },
    {
      accessorKey: "text",
      header: "Testimonial",
      size: 300,
      cell: ({ getValue, row }) => (
        <div className="space-y-1">
          <p 
            className="text-sm text-gray-700 max-w-xs leading-relaxed line-clamp-2"
            title={getValue()}
          >
            "{truncateText(getValue(), 60)}"
          </p>
          {getValue() && getValue().length > 60 && (
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                {getValue().length} chars
              </Badge>
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      size: 120,
      cell: ({ getValue }) => (
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(getValue()).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      size: 100,
      cell: ({ getValue, row }) => (
        <div className="flex items-center space-x-2">
          <Switch
            checked={getValue()}
            onCheckedChange={() => toggleTestimonialStatus(row.original.id, getValue())}
            disabled={toggleLoading[row.original.id]}
            className="data-[state=checked]:bg-green-500"
          />
          <span className={`text-xs font-medium ${getValue() ? 'text-green-600' : 'text-gray-500'}`}>
            {toggleLoading[row.original.id] ? (
              <div className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating...
              </div>
            ) : (getValue() ? 'Active' : 'Inactive')}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 100,
      cell: ({ row }) => (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openViewModal(row.original)}
            className="h-8 w-8 p-0 hover:bg-blue-50"
            title="View full testimonial"
          >
            <Eye className="h-4 w-4 text-blue-600" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50"
                title="Delete testimonial"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  testimonial from {row.original.name}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteTestimonial(row.original.id)}
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

  return (
    <div className="container mx-auto p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Client Testimonials
          </h1>
          <p className="text-muted-foreground">
            Manage text-based client feedback and reviews
          </p>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Testimonials</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalTestimonials}</div>
            <p className="text-xs text-muted-foreground">Written reviews</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Reviews</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeTestimonials}</div>
            <p className="text-xs text-muted-foreground">Published reviews</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">5-Star Reviews</CardTitle>
            <Star className="h-4 w-4 text-yellow-500 fill-current" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.fiveStarReviews}</div>
            <p className="text-xs text-muted-foreground">Excellent ratings</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center space-x-1 text-purple-600">
              <span>{stats.averageRating}</span>
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">Out of 5 stars</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            All Text Testimonials ({testimonials.length})
          </CardTitle>
          <CardDescription>
            Manage testimonial visibility with active/inactive toggle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={testimonials}
            columns={columns}
            loading={loading}
            enableSorting={true}
            enableFiltering={true}
            enablePagination={true}
            pageSize={10}
            emptyMessage="No text testimonials found"
            className="border-0"
          />
        </CardContent>
      </Card>

      {/* Enhanced View Testimonial Modal */}
      <TestimonialViewModal
        open={isViewModalOpen}
        onOpenChange={closeViewModal}
        testimonial={selectedTestimonial}
        onToggleStatus={toggleTestimonialStatus}
        toggleLoading={toggleLoading}
        formatDate={formatDate}
      />
    </div>
  );
};

// Enhanced Testimonial View Modal Component
const TestimonialViewModal = ({
  open,
  onOpenChange,
  testimonial,
  onToggleStatus,
  toggleLoading,
  formatDate
}) => {
  if (!testimonial) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Client Testimonial
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Info Section */}
          <div className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <Avatar className="h-16 w-16">
              <AvatarImage src={testimonial.image} alt="Client" />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg">
                {testimonial.name?.charAt(0)?.toUpperCase() || 'C'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {testimonial.name}
                </h3>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={testimonial.isActive ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {testimonial.isActive ? "Published" : "Pending"}
                  </Badge>
                  {testimonial.featured && (
                    <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                      ⭐ Featured
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {testimonial.location || 'Location not specified'}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(testimonial.createdAt)}
                </div>
              </div>

              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {testimonial.service}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Status Toggle Section */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Publication Status</h4>
              <p className="text-sm text-gray-600">
                Control whether this testimonial is visible to the public
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={testimonial.isActive}
                onCheckedChange={() => onToggleStatus(testimonial.id, testimonial.isActive)}
                disabled={toggleLoading[testimonial.id]}
                className="data-[state=checked]:bg-green-500"
              />
              <span className={`text-sm font-medium ${testimonial.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                {toggleLoading[testimonial.id] ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </div>
                ) : (testimonial.isActive ? 'Active' : 'Inactive')}
              </span>
            </div>
          </div>

          {/* Rating Section */}
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Rating</h4>
            <div className="flex items-center space-x-2">
              <div className="flex">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className={`h-6 w-6 ${
                      index < testimonial.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {testimonial.rating}/5
              </span>
              <Badge variant="outline" className="ml-2">
                {testimonial.rating === 5 ? 'Excellent' : 
                 testimonial.rating >= 4 ? 'Good' : 
                 testimonial.rating >= 3 ? 'Average' : 'Poor'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Testimonial Text Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Testimonial</h4>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-500">Text Review</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-l-blue-500">
              <p className="text-gray-800 leading-relaxed italic text-lg">
                "{testimonial.text || 'No testimonial text provided.'}"
              </p>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{testimonial.text?.length || 0} characters</span>
              <span>
                {testimonial.text?.split(' ').length || 0} words
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestimonialsPage;
