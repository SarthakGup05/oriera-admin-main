// pages/EnquiryPage.jsx
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
import {
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Camera,
  Loader2,
  RefreshCw,
  TrendingUp,
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
import useEnquiryStore from "@/store/useEnquiryStore";

const EnquiryPage = () => {
  const { state } = useSidebar();
  
  // Zustand store selectors
  const {
    // State
    enquiries,
    services,
    loading,
    loadingServices,
    saving,
    deleting,
    refreshing,
    dialogOpen,
    dialogMode,
    selectedEnquiry,
    formData,
    statusConfig,
    
    // Actions
    fetchEnquiries,
    fetchServices,
    deleteEnquiry,
    openViewDialog,
    openEditDialog,
    closeDialog,
    saveEnquiry,
    updateFormField,
    refreshData,
    
    // Helpers
    getServiceInfo,
    
    // Computed
    getStats,
    getStatusCounts
  } = useEnquiryStore();

  // Get computed values
  const stats = getStats();
  const statusCounts = getStatusCounts();

  useEffect(() => {
    Promise.all([fetchEnquiries(), fetchServices()]);
  }, [fetchEnquiries, fetchServices]);

  // Dynamic spacing based on sidebar state
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

  // Column definitions
  const columns = [
    {
      accessorKey: "name",
      header: "Client Details",
      cell: ({ getValue, row }) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <p className="font-medium text-sm">{getValue()}</p>
            {!row.original.isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{row.original.email}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{row.original.phone}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "serviceType",
      header: "Service Type",
      cell: ({ getValue }) => {
        const serviceInfo = getServiceInfo(getValue());
        const colors = [
          "bg-pink-100 text-pink-800",
          "bg-purple-100 text-purple-800",
          "bg-rose-100 text-rose-800",
          "bg-blue-100 text-blue-800",
          "bg-green-100 text-green-800",
          "bg-indigo-100 text-indigo-800",
          "bg-yellow-100 text-yellow-800",
          "bg-cyan-100 text-cyan-800",
        ];

        if (serviceInfo) {
          const colorIndex = services.findIndex((s) => s.id === serviceInfo.id);
          const color = colors[colorIndex % colors.length];

          return (
            <Badge className={`text-xs ${color}`}>
              <Camera className="h-3 w-3 mr-1" />
              {serviceInfo.title}
            </Badge>
          );
        }

        // Fallback for unknown service types
        return (
          <Badge className="text-xs bg-gray-100 text-gray-800">
            <Camera className="h-3 w-3 mr-1" />
            {getValue()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "message",
      header: "Message",
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
      cell: ({ getValue, row }) => {
        const config = statusConfig[getValue()];
        return (
          <div className="flex items-center space-x-2">
            <Badge
              variant={config.variant}
              className={config.className || "text-xs"}
            >
              {config.label}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Submitted",
      size: 120,
      cell: ({ getValue }) => {
        const dateValue = getValue();

        if (!dateValue) {
          return (
            <div className="text-xs text-muted-foreground">
              <div>N/A</div>
            </div>
          );
        }

        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          return (
            <div className="text-xs text-muted-foreground">
              <div className="text-red-500">Invalid Date</div>
            </div>
          );
        }

        return (
          <div className="text-xs text-muted-foreground">
            <div>{date.toLocaleDateString("en-IN")}</div>
            <div>
              {date.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      size: 120,
      cell: ({ row }) => {
        const enquiry = row.original;
        const isDeleting = deleting === enquiry.id;

        return (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openViewDialog(enquiry)}
              className="h-8 w-8 p-0"
              disabled={isDeleting}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEditDialog(enquiry)}
              className="h-8 w-8 p-0"
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
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the enquiry from "{enquiry.name}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteEnquiry(enquiry.id)}
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
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Enquiry Management
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Manage and track client enquiries from your website
          </p>
          {loadingServices && (
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Loading services...
            </p>
          )}
        </div>
        <Button
          onClick={refreshData}
          disabled={loading || refreshing}
          variant="outline"
        >
          {refreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 lg:gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Enquiries
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnquiries}</div>
            <p className="text-xs text-muted-foreground">All time enquiries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Enquiries</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.newEnquiries}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.convertedEnquiries}
            </div>
            <p className="text-xs text-muted-foreground">Successful bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Success percentage</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Status Overview */}
      <div className="grid gap-3 lg:gap-4 md:grid-cols-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = statusCounts[status] || 0;
          const IconComponent = () => {
            switch(status) {
              case 'NEW': return <AlertCircle className={`h-8 w-8 ${config.color}`} />;
              case 'PENDING': return <Clock className={`h-8 w-8 ${config.color}`} />;
              case 'CONVERTED': return <CheckCircle className={`h-8 w-8 ${config.color}`} />;
              case 'REJECTED': return <XCircle className={`h-8 w-8 ${config.color}`} />;
              default: return <AlertCircle className={`h-8 w-8 ${config.color}`} />;
            }
          };
          
          return (
            <Card key={status} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <IconComponent />
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">
                      {config.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className={state === "expanded" ? "pb-4" : ""}>
          <CardTitle className="text-lg lg:text-xl">
            All Enquiries ({enquiries.length})
          </CardTitle>
          <CardDescription>
            Manage client enquiries and track their status
          </CardDescription>
        </CardHeader>
        <CardContent className={state === "expanded" ? "p-4" : ""}>
          <DataTable
            data={enquiries}
            columns={columns}
            loading={loading}
            enableSorting={true}
            enableFiltering={true}
            enablePagination={true}
            pageSize={10}
            emptyMessage="No enquiries found"
            className="border-0"
          />
        </CardContent>
      </Card>

      {/* Enhanced Enquiry Dialog */}
      <EnquiryDialog
        open={dialogOpen}
        onOpenChange={closeDialog}
        mode={dialogMode}
        formData={formData}
        saving={saving}
        onSave={saveEnquiry}
        onUpdateField={updateFormField}
        getServiceInfo={getServiceInfo}
        statusConfig={statusConfig}
      />
    </div>
  );
};

// Enhanced Enquiry Dialog Component
const EnquiryDialog = ({
  open,
  onOpenChange,
  mode,
  formData,
  saving,
  onSave,
  onUpdateField,
  getServiceInfo,
  statusConfig
}) => {
  const isReadOnly = mode === "view";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Edit Enquiry" : "Enquiry Details"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the enquiry status and add notes."
              : "View the complete enquiry information."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Client Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={formData.name || ""} disabled className="mt-1" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={formData.email || ""} disabled className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone</Label>
              <Input value={formData.phone || ""} disabled className="mt-1" />
            </div>
            <div>
              <Label>Service Type</Label>
              <Input
                value={(() => {
                  const serviceInfo = getServiceInfo(formData.serviceType);
                  return serviceInfo?.title || formData.serviceType || "";
                })()}
                disabled
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Message</Label>
            <Textarea
              value={formData.message || ""}
              disabled
              className="mt-1"
              rows={4}
            />
          </div>

          {/* Status - Editable */}
          <div>
            <Label htmlFor="status">Status</Label>
            {isReadOnly ? (
              <div className="mt-1">
                <Badge
                  variant={statusConfig[formData.status]?.variant}
                  className="text-sm"
                >
                  {statusConfig[formData.status]?.label}
                </Badge>
              </div>
            ) : (
              <Select
                value={formData.status}
                onValueChange={(value) => onUpdateField("status", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONVERTED">Converted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Notes - Editable */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => onUpdateField("notes", e.target.value)}
              className="mt-1"
              disabled={isReadOnly}
              placeholder="Add notes or comments..."
              rows={3}
            />
          </div>

          {/* Submitted Date */}
          <div>
            <Label>Submitted</Label>
            <Input
              value={
                formData.submittedAt || formData.createdAt
                  ? new Date(formData.submittedAt || formData.createdAt).toLocaleString("en-IN")
                  : ""
              }
              disabled
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onOpenChange}
            disabled={saving}
          >
            {isReadOnly ? "Close" : "Cancel"}
          </Button>
          {!isReadOnly && (
            <Button onClick={onSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnquiryPage;
