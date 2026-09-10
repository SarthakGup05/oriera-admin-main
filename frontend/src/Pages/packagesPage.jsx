// pages/PackagesPage.jsx
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
  Plus,
  Package,
  DollarSign,
  Image,
  Loader2,
  TrendingUp,
  Activity,
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
import usePackagesStore from "@/store/usePackagesStore";

const PackagesPage = () => {
  const { state } = useSidebar();
  
  // Zustand store selectors
  const {
    // State
    packages,
    services,
    loading,
    saving,
    dialogOpen,
    dialogMode,
    selectedPackage,
    formData,
    
    // Actions
    fetchPackages,
    fetchServices,
    openAddDialog,
    openViewDialog,
    openEditDialog,
    closeDialog,
    savePackage,
    deletePackage,
    updateFormField,
    updateInclusion,
    addInclusion,
    removeInclusion,
    
    // Helpers
    getServiceName,
    formatPrice,
    
    // Computed
    getStats,
    getSortedPackages
  } = usePackagesStore();

  // Get computed values
  const stats = getStats();
  const sortedPackages = getSortedPackages();

  useEffect(() => {
    Promise.all([fetchPackages(), fetchServices()]);
  }, [fetchPackages, fetchServices]);

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
      accessorKey: "title",
      header: "Package Name",
      cell: ({ getValue, row }) => (
        <div className="space-y-1">
          <p className="font-medium text-sm">{getValue()}</p>
          <Badge variant="default" className="text-xs">
            Active
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ getValue }) => (
        <div className="flex items-center space-x-1">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-semibold">{getValue()}</span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      size: 300,
      cell: ({ getValue }) => (
        <p className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
          {getValue()}
        </p>
      ),
    },
    {
      accessorKey: "inclusions",
      header: "Inclusions",
      size: 200,
      cell: ({ getValue }) => (
        <div className="space-y-1">
          {getValue()
            .slice(0, 2)
            .map((inclusion, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs block w-fit"
              >
                {inclusion}
              </Badge>
            ))}
          {getValue().length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{getValue().length - 2} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "service",
      header: "Service",
      cell: ({ row }) => {
        const serviceName = getServiceName(row.original.serviceId);
        return (
          <Badge variant="outline" className="text-xs">
            {serviceName}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
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
            onClick={() => openViewDialog(row.original)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditDialog(row.original)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  package "{row.original.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deletePackage(row.original.id)}
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
    <div className={`${getContainerClass()} ${getSpacing()}`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            Photography Packages
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Manage photography packages and pricing
          </p>
        </div>
        <Button onClick={openAddDialog} className="w-fit">
          <Plus className="mr-2 h-4 w-4" />
          Add New Package
        </Button>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-3 lg:gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Packages
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPackages}</div>
            <p className="text-xs text-muted-foreground">Available packages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Packages
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activePackages}</div>
            <p className="text-xs text-muted-foreground">Currently offered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{stats.averagePrice.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">Across all packages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Range</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              ₹{stats.priceRange.min.toLocaleString("en-IN")} - ₹{stats.priceRange.max.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-muted-foreground">Min - Max pricing</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className={state === "expanded" ? "pb-4" : ""}>
          <CardTitle className="text-lg lg:text-xl">
            All Packages ({sortedPackages.length})
          </CardTitle>
          <CardDescription>
            Manage your photography packages and pricing
          </CardDescription>
        </CardHeader>
        <CardContent className={state === "expanded" ? "p-4" : ""}>
          <DataTable
            data={sortedPackages}
            columns={columns}
            loading={loading}
            enableSorting={true}
            enableFiltering={true}
            enablePagination={true}
            pageSize={10}
            emptyMessage="No packages found"
            className="border-0"
          />
        </CardContent>
      </Card>

      {/* Enhanced Package Dialog */}
      <PackageDialog
        open={dialogOpen}
        onOpenChange={closeDialog}
        mode={dialogMode}
        formData={formData}
        services={services}
        saving={saving}
        onSave={savePackage}
        onUpdateField={updateFormField}
        onUpdateInclusion={updateInclusion}
        onAddInclusion={addInclusion}
        onRemoveInclusion={removeInclusion}
        getServiceName={getServiceName}
      />
    </div>
  );
};

// Enhanced Package Dialog Component
const PackageDialog = ({
  open,
  onOpenChange,
  mode,
  formData,
  services,
  saving,
  onSave,
  onUpdateField,
  onUpdateInclusion,
  onAddInclusion,
  onRemoveInclusion,
  getServiceName
}) => {
  const isReadOnly = mode === "view";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" && "Add New Package"}
            {mode === "edit" && "Edit Package"}
            {mode === "view" && "Package Details"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add" &&
              "Create a new photography package with pricing and inclusions."}
            {mode === "edit" &&
              "Update the package details and pricing."}
            {mode === "view" &&
              "View the complete package information."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Package Title */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => onUpdateField("title", e.target.value)}
              className="col-span-3"
              disabled={isReadOnly}
              placeholder="Enter package title"
            />
          </div>

          {/* Service Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="serviceId" className="text-right">
              Service <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3">
              {isReadOnly ? (
                <Input
                  value={getServiceName(formData.serviceId)}
                  disabled
                  className="col-span-3"
                />
              ) : (
                <Select
                  value={formData.serviceId.toString()}
                  onValueChange={(value) => onUpdateField("serviceId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem
                        key={service.id}
                        value={service.id.toString()}
                      >
                        {service.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Package Price */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Price (₹) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="price"
              value={formData.price}
              onChange={(e) => onUpdateField("price", e.target.value)}
              className="col-span-3"
              disabled={isReadOnly}
              placeholder="Enter price"
              type="number"
            />
          </div>

          {/* Package Description */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right pt-2">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onUpdateField("description", e.target.value)}
              className="col-span-3"
              disabled={isReadOnly}
              placeholder="Enter package description"
              rows={3}
            />
          </div>

          {/* Package Inclusions */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">
              Inclusions <span className="text-red-500">*</span>
            </Label>
            <div className="col-span-3 space-y-2">
              {formData.inclusions.map((inclusion, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={inclusion}
                    onChange={(e) => onUpdateInclusion(index, e.target.value)}
                    placeholder={`Inclusion ${index + 1}`}
                    disabled={isReadOnly}
                    className="flex-1"
                  />
                  {!isReadOnly && formData.inclusions.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onRemoveInclusion(index)}
                      className="px-3"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAddInclusion}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Inclusion
                </Button>
              )}
            </div>
          </div>
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
                  {mode === "add" ? "Creating..." : "Saving..."}
                </>
              ) : (
                mode === "add" ? "Add Package" : "Save Changes"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PackagesPage;
