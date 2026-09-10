// controllers/dashboardController.js
import { db } from "../libs/db.js";

export const dashboardController = {
  // Get dashboard statistics
  getDashboardStats: async (req, res) => {
    try {
      // Get current date ranges
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Enquiries Statistics (using Contact model)
      const totalEnquiries = await db.contact.count();
      const newEnquiries = await db.contact.count({
        where: {
          createdAt: {
            gte: startOfWeek
          }
        }
      });

      // Conversion Statistics
      const convertedBookings = await db.contact.count({
        where: {
          status: 'CONVERTED'
        }
      });
      const conversionRate = totalEnquiries > 0 ? ((convertedBookings / totalEnquiries) * 100) : 0;

      // Testimonials Statistics
      const totalTestimonials = await db.testimonial.count({
        where: { isActive: true }
      });
      
      const averageRatingResult = await db.testimonial.aggregate({
        _avg: {
          rating: true
        },
        where: { 
          isActive: true,
          type: 'text' // Only text testimonials for average
        }
      });
      const averageRating = averageRatingResult._avg.rating ? 
        parseFloat(averageRatingResult._avg.rating.toFixed(1)) : 0;

      // Package Statistics
      const totalPackages = await db.package.count();
      const activeServices = await db.service.count({
        where: { isActive: true }
      });

      // Stories Statistics
      const totalStories = await db.story.count({
        where: { isActive: true }
      });
      const featuredStories = await db.story.count({
        where: { 
          featured: true,
          isActive: true 
        }
      });

      // Gallery Statistics
      const totalGalleryImages = await db.gallery.count({
        where: { isActive: true }
      });

      // Service type breakdown
      const serviceTypeBreakdown = await db.contact.groupBy({
        by: ['serviceType'],
        _count: {
          serviceType: true
        },
        orderBy: {
          _count: {
            serviceType: 'desc'
          }
        },
        take: 5
      });

      res.json({
        success: true,
        stats: {
          totalEnquiries,
          newEnquiries,
          convertedBookings,
          conversionRate: parseFloat(conversionRate.toFixed(1)),
          totalTestimonials,
          averageRating,
          totalPackages,
          activeServices,
          totalStories,
          featuredStories,
          totalGalleryImages,
          serviceTypeBreakdown
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message
      });
    }
  },

  // Get recent enquiries (using Contact model)
  getRecentEnquiries: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      
      const recentEnquiries = await db.contact.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          name: true,
          serviceType: true,
          status: true,
          createdAt: true,
          email: true
        }
      });

      res.json({
        success: true,
        enquiries: recentEnquiries
      });
    } catch (error) {
      console.error('Error fetching recent enquiries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent enquiries',
        error: error.message
      });
    }
  },

  // Get recent testimonials
// controllers/dashboardController.js
getRecentTestimonials: async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const recentTestimonials = await db.testimonial.findMany({
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      where: { 
        type: 'text' // Only text testimonials
      },
      select: {
        id: true,
        name: true,
        rating: true,
        service: true,
        text: true,
        image: true,
        location: true,
        isActive: true,
        featured: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      testimonials: recentTestimonials
    });
  } catch (error) {
    console.error('Error fetching recent testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent testimonials',
      error: error.message
    });
  }
},

// Get testimonials statistics
getTestimonialStats: async (req, res) => {
  try {
    const totalTestimonials = await db.testimonial.count({
      where: { type: 'text' }
    });

    const activeTestimonials = await db.testimonial.count({
      where: { 
        isActive: true,
        type: 'text'
      }
    });

    const featuredTestimonials = await db.testimonial.count({
      where: { 
        featured: true,
        type: 'text'
      }
    });

    const averageRatingResult = await db.testimonial.aggregate({
      _avg: {
        rating: true
      },
      where: { 
        type: 'text'
      }
    });

    const ratingDistribution = await db.testimonial.groupBy({
      by: ['rating'],
      _count: {
        rating: true
      },
      where: { type: 'text' }
    });

    const serviceBreakdown = await db.testimonial.groupBy({
      by: ['service'],
      _count: {
        service: true
      },
      where: { type: 'text' },
      orderBy: {
        _count: {
          service: 'desc'
        }
      }
    });

    res.json({
      success: true,
      stats: {
        total: totalTestimonials,
        active: activeTestimonials,
        featured: featuredTestimonials,
        averageRating: averageRatingResult._avg.rating ? 
          parseFloat(averageRatingResult._avg.rating.toFixed(1)) : 0,
        ratingDistribution,
        serviceBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching testimonial stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonial statistics',
      error: error.message
    });
  }
},


  // Get popular services (based on enquiries)
  getPopularServices: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;
      
      const serviceStats = await db.contact.groupBy({
        by: ['serviceType'],
        _count: {
          serviceType: true
        },
        orderBy: {
          _count: {
            serviceType: 'desc'
          }
        },
        take: limit
      });

      // Get service details
      const popularServices = await Promise.all(
        serviceStats.map(async (stat) => {
          const service = await db.service.findFirst({
            where: {
              slug: stat.serviceType,
              isActive: true
            },
            select: {
              id: true,
              name: true,
              title: true,
              slug: true
            }
          });

          return {
            id: service?.id || stat.serviceType,
            title: service?.title || stat.serviceType,
            name: service?.name || stat.serviceType,
            enquiries: stat._count.serviceType
          };
        })
      );

      res.json({
        success: true,
        services: popularServices
      });
    } catch (error) {
      console.error('Error fetching popular services:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch popular services',
        error: error.message
      });
    }
  },

  // Get recent stories
  getRecentStories: async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 3;
      
      const recentStories = await db.story.findMany({
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        where: {
          isActive: true,
          status: 'published'
        },
        select: {
          id: true,
          title: true,
          category: true,
          mainImage: true,
          featured: true,
          location: true,
          date: true
        }
      });

      res.json({
        success: true,
        stories: recentStories
      });
    } catch (error) {
      console.error('Error fetching recent stories:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent stories',
        error: error.message
      });
    }
  },

  // Get gallery stats
  getGalleryStats: async (req, res) => {
    try {
      const totalImages = await db.gallery.count({
        where: { isActive: true }
      });

      const categoryBreakdown = await db.gallery.groupBy({
        by: ['category'],
        _count: {
          category: true
        },
        where: { isActive: true },
        orderBy: {
          _count: {
            category: 'desc'
          }
        }
      });

      const recentUploads = await db.gallery.count({
        where: {
          isActive: true,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });

      res.json({
        success: true,
        gallery: {
          totalImages,
          recentUploads,
          categoryBreakdown
        }
      });
    } catch (error) {
      console.error('Error fetching gallery stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch gallery statistics',
        error: error.message
      });
    }
  },

  // Get complete dashboard data
  getDashboardData: async (req, res) => {
    try {
      const [
        statsData,
        enquiriesData,
        testimonialsData,
        servicesData,
        storiesData,
        galleryData
      ] = await Promise.all([
        dashboardController.getDashboardStats({ ...req }, { json: (data) => data }),
        dashboardController.getRecentEnquiries({ ...req, query: { limit: 3 } }, { json: (data) => data }),
        dashboardController.getRecentTestimonials({ ...req, query: { limit: 3 } }, { json: (data) => data }),
        dashboardController.getPopularServices({ ...req, query: { limit: 3 } }, { json: (data) => data }),
        dashboardController.getRecentStories({ ...req, query: { limit: 2 } }, { json: (data) => data }),
        dashboardController.getGalleryStats({ ...req }, { json: (data) => data })
      ]);

      res.json({
        success: true,
        data: {
          stats: statsData.stats,
          recentEnquiries: enquiriesData.enquiries,
          recentTestimonials: testimonialsData.testimonials,
          popularServices: servicesData.services,
          recentStories: storiesData.stories,
          gallery: galleryData.gallery
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message
      });
    }
  },

  // Get status distribution
  getStatusDistribution: async (req, res) => {
    try {
      const statusStats = await db.contact.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      });

      const distribution = statusStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.status;
        return acc;
      }, {});

      res.json({
        success: true,
        distribution
      });
    } catch (error) {
      console.error('Error fetching status distribution:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch status distribution',
        error: error.message
      });
    }
  },
//get popular packages
getPopularPackages: async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const packages = await db.package.findMany({
      take: limit,
      orderBy: [
        { createdAt: 'desc' } // Most recent packages first
      ]
    });

    const formattedPackages = packages.map(pkg => ({
      id: pkg.id,
      title: pkg.title,
      price: pkg.price,
      description: pkg.description,
      inclusions: pkg.inclusions,
      serviceId: pkg.serviceId,
      bookings: Math.floor(Math.random() * 10) + 1 // Temporary random number for demo
    }));

    res.json({
      success: true,
      packages: formattedPackages
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages',
      error: error.message
    });
  }
}

};



