// pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Star, 
  TrendingUp, 
  Calendar, 
  Mail, 
  Package,
  BookOpen,
  Eye,
  Heart,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  Camera,
  Image,
  MessageSquare
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSidebar } from "@/components/ui/sidebar";
import axiosInstance from "@/lib/axiosinstaance";
import { toast } from "react-hot-toast";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalEnquiries: 0,
      newEnquiries: 0,
      convertedBookings: 0,
      conversionRate: 0,
      totalTestimonials: 0,
      averageRating: 0,
      totalPackages: 0,
      activeServices: 0,
      totalStories: 0,
      featuredStories: 0,
      totalGalleryImages: 0
    },
    recentEnquiries: [],
    recentTestimonials: [],
    popularServices: [],
    recentStories: [],
    gallery: {
      totalImages: 0,
      recentUploads: 0,
      categoryBreakdown: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { state } = useSidebar();

  // Fetch dashboard data from API
const fetchDashboardData = async (showRefreshLoader = false) => {
  try {
    if (showRefreshLoader) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    // Use the new route structure
    const [
      statsResponse,
      enquiriesResponse,
      testimonialsResponse,
      servicesResponse,
      packagesResponse,
      galleryResponse
    ] = await Promise.all([
      axiosInstance.get('/dashboard/stats'),
      axiosInstance.get('/dashboard/enquiries/recent?limit=3'),
      axiosInstance.get('/dashboard/testimonials/recent?limit=3'),
      axiosInstance.get('/dashboard/services/popular?limit=3'),
      axiosInstance.get('/dashboard/packages/popular?limit=3'),
      axiosInstance.get('/dashboard/gallery/stats')
    ]);

    if (statsResponse.data.success) {
      setDashboardData({
        stats: statsResponse.data.stats,
        recentEnquiries: enquiriesResponse.data.enquiries || [],
        recentTestimonials: testimonialsResponse.data.testimonials || [],
        popularServices: servicesResponse.data.services || [],
        popularPackages: packagesResponse.data.packages || [],
        gallery: galleryResponse.data.gallery || {}
      });
    } else {
      toast.error('Failed to fetch dashboard data');
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    toast.error('Failed to load dashboard data');
  } finally {
    setLoading(false);
    setRefreshing(false);
  }
};
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

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

  const statusConfig = {
    NEW: { label: "New", icon: AlertCircle, color: "text-blue-600" },
    PENDING: { label: "Pending", icon: Clock, color: "text-yellow-600" },
    CONVERTED: { label: "Converted", icon: CheckCircle, color: "text-green-600" },
    REJECTED: { label: "Rejected", icon: AlertCircle, color: "text-red-600" }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`${getContainerClass()} ${getSpacing()}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Photography Dashboard
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Welcome back! Here's what's happening with your photography business.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <div className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-IN", {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enquiries</CardTitle>
            <Mail className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dashboardData.stats.totalEnquiries}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600 font-medium">{dashboardData.stats.newEnquiries} new</span> this week
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardData.stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">{dashboardData.stats.convertedBookings}</span> converted bookings
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center text-yellow-600">
              {dashboardData.stats.averageRating}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 ml-1" />
            </div>
            <p className="text-xs text-muted-foreground">
              From {dashboardData.stats.totalTestimonials} testimonials
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gallery Images</CardTitle>
            <Image className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{dashboardData.gallery?.totalImages || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-purple-600 font-medium">{dashboardData.gallery?.recentUploads || 0}</span> this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Services</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.activeServices}</div>
            <p className="text-xs text-muted-foreground">Available services</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.totalPackages}</div>
            <p className="text-xs text-muted-foreground">Photography packages</p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured Stories</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.featuredStories}</div>
            <p className="text-xs text-muted-foreground">Out of {dashboardData.stats.totalStories} stories</p>
          </CardContent>
        </Card> */}
      </div>

      {/* Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Recent Enquiries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Enquiries</CardTitle>
              <CardDescription>Latest client inquiries</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/enquiries">
                View All <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentEnquiries.length > 0 ? (
                dashboardData.recentEnquiries.map((enquiry) => {
                  const StatusIcon = statusConfig[enquiry.status]?.icon || AlertCircle;
                  return (
                    <div key={enquiry.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{enquiry.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {enquiry.serviceType} photography
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[enquiry.status]?.label || enquiry.status}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent enquiries
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Popular Services</CardTitle>
              <CardDescription>Most requested services</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/services">
                View All <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.popularServices?.length > 0 ? (
                dashboardData.popularServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{service.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {service.enquiries} enquiries
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Popular
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No service data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Testimonials */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Reviews</CardTitle>
              <CardDescription>Latest client feedback</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/testimonials">
                View All <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentTestimonials.length > 0 ? (
                dashboardData.recentTestimonials.map((testimonial) => (
                  <div key={testimonial.id} className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={testimonial.image} alt={testimonial.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {testimonial.name?.charAt(0)?.toUpperCase() || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-sm">{testimonial.name}</p>
                          <div className="flex">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {testimonial.text}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No testimonials available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
              <Link to="/enquiries">
                <Mail className="h-6 w-6" />
                <span className="text-sm">Enquiries</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
              <Link to="/services">
                <Camera className="h-6 w-6" />
                <span className="text-sm">Services</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
              <Link to="/testimonials">
                <Star className="h-6 w-6" />
                <span className="text-sm">Reviews</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
              <Link to="/capture/gallery">
                <Image className="h-6 w-6" />
                <span className="text-sm">Gallery</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2" asChild>
              <Link to="/testimonials">
                <MessageSquare className="h-6 w-6" />
                <span className="text-sm">Testimonials</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
