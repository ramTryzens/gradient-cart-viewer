import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import {
  getEcommerceDetails,
  createEcommerceDetail,
  updateEcommerceDetail,
  deleteEcommerceDetail,
  type EcommerceDetail,
  type CredentialField,
} from "@/lib/api";

type ApiUrlEntry = {
  name: string;
  endpoint: string;
  method: string;
};

const EcommerceTab = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<EcommerceDetail | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    enabled: true,
    api_urls: [] as ApiUrlEntry[],
    required_credentials: [] as CredentialField[],
  });

  // Fetch data
  const { data: platforms, isLoading } = useQuery({
    queryKey: ["ecommerce-details"],
    queryFn: getEcommerceDetails,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createEcommerceDetail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-details"] });
      toast.success("Platform created successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create platform");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EcommerceDetail> }) =>
      updateEcommerceDetail(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-details"] });
      toast.success("Platform updated successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update platform");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEcommerceDetail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ecommerce-details"] });
      toast.success("Platform deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete platform");
    },
  });

  const handleOpenDialog = (platform?: EcommerceDetail) => {
    if (platform) {
      setEditingPlatform(platform);
      // Convert api_urls object to array for editing
      const apiUrlsArray = platform.api_urls
        ? Object.entries(platform.api_urls).map(([name, config]) => ({
            name,
            endpoint: config.endpoint,
            method: config.method,
          }))
        : [];

      setFormData({
        name: platform.name,
        enabled: platform.enabled,
        api_urls: apiUrlsArray,
        required_credentials: platform.required_credentials || [],
      });
    } else {
      setEditingPlatform(null);
      setFormData({
        name: "",
        enabled: true,
        api_urls: [],
        required_credentials: [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPlatform(null);
    setFormData({
      name: "",
      enabled: true,
      api_urls: [],
      required_credentials: [],
    });
  };

  const handleAddApiUrl = () => {
    setFormData({
      ...formData,
      api_urls: [
        ...formData.api_urls,
        { name: "", endpoint: "", method: "GET" },
      ],
    });
  };

  const handleRemoveApiUrl = (index: number) => {
    setFormData({
      ...formData,
      api_urls: formData.api_urls.filter((_, i) => i !== index),
    });
  };

  const handleApiUrlChange = (
    index: number,
    field: keyof ApiUrlEntry,
    value: string
  ) => {
    const newApiUrls = [...formData.api_urls];
    newApiUrls[index] = { ...newApiUrls[index], [field]: value };
    setFormData({ ...formData, api_urls: newApiUrls });
  };

  const handleAddCredential = () => {
    setFormData({
      ...formData,
      required_credentials: [
        ...formData.required_credentials,
        { key: "", label: "", description: "", type: "text", required: true },
      ],
    });
  };

  const handleRemoveCredential = (index: number) => {
    setFormData({
      ...formData,
      required_credentials: formData.required_credentials.filter((_, i) => i !== index),
    });
  };

  const handleCredentialChange = (
    index: number,
    field: keyof CredentialField,
    value: string | boolean
  ) => {
    const newCredentials = [...formData.required_credentials];
    newCredentials[index] = { ...newCredentials[index], [field]: value };
    setFormData({ ...formData, required_credentials: newCredentials });
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate credentials if any
    for (const credential of formData.required_credentials) {
      if (!credential.key || !credential.label) {
        toast.error("Please fill in all credential fields (key and label are required) or remove empty entries");
        return;
      }
    }

    // Convert api_urls array back to object format
    const apiUrlsObject = formData.api_urls.reduce((acc, url) => {
      acc[url.name] = {
        endpoint: url.endpoint,
        method: url.method,
      };
      return acc;
    }, {} as Record<string, { endpoint: string; method: string }>);

    // Clean credentials - remove any _id fields that might exist
    const cleanedCredentials = formData.required_credentials.map(({ key, label, description, type, required }) => ({
      key,
      label,
      description,
      type,
      required,
    }));

    const platformData = {
      name: formData.name,
      enabled: formData.enabled,
      api_urls: Object.keys(apiUrlsObject).length > 0 ? apiUrlsObject : undefined,
      required_credentials: cleanedCredentials, // Always send the array, even if empty
    };

    console.log('Submitting platform data:', platformData);

    if (editingPlatform) {
      updateMutation.mutate({ id: editingPlatform._id, data: platformData });
    } else {
      createMutation.mutate(platformData);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this platform?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleEnabled = (platform: EcommerceDetail) => {
    updateMutation.mutate({
      id: platform._id,
      data: { enabled: !platform.enabled },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            E-commerce Platforms
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage supported e-commerce platforms and their API configurations
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Platform
        </Button>
      </div>

      <div className="border border-white/10 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-white/5 border-white/10">
              <TableHead className="text-foreground">Platform Name</TableHead>
              <TableHead className="text-foreground">Credentials</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="text-foreground">Created</TableHead>
              <TableHead className="text-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {platforms?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No platforms found. Add your first platform to get started.
                </TableCell>
              </TableRow>
            ) : (
              platforms?.map((platform) => (
                <TableRow
                  key={platform._id}
                  className="hover:bg-white/5 border-white/10"
                >
                  <TableCell className="font-medium text-foreground">
                    {platform.name}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {platform.required_credentials && platform.required_credentials.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {platform.required_credentials
                          .slice(0, 2)
                          .map((cred, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded"
                            >
                              {cred.label}
                            </span>
                          ))}
                        {platform.required_credentials.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{platform.required_credentials.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-xs">
                        No credentials
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={platform.enabled}
                        onCheckedChange={() => handleToggleEnabled(platform)}
                      />
                      <Badge
                        variant={platform.enabled ? "default" : "secondary"}
                      >
                        {platform.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">
                    {new Date(platform.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(platform)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(platform._id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlatform ? "Edit Platform" : "Add New Platform"}
            </DialogTitle>
            <DialogDescription>
              {editingPlatform
                ? "Update platform details and credential requirements"
                : "Create a new e-commerce platform integration"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name *</Label>
              <Input
                id="platform-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Shopify, BigCommerce"
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <div className="space-y-0.5">
                <Label htmlFor="enabled">Enable Platform</Label>
                <p className="text-sm text-muted-foreground">
                  Allow merchants to use this platform
                </p>
              </div>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Required Credentials (Optional)</Label>
                  <p className="text-sm text-muted-foreground">
                    Define credentials that merchants need to provide when setting up this platform
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCredential}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Credential
                </Button>
              </div>

              {formData.required_credentials.length > 0 && (
                <div className="space-y-3 border border-white/10 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {formData.required_credentials.map((credential, index) => (
                    <div
                      key={index}
                      className="space-y-2 p-3 bg-white/5 rounded-lg relative"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCredential(index)}
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </Button>

                      <div className="space-y-2 pr-8">
                        <div>
                          <Label className="text-xs">Credential Key *</Label>
                          <Input
                            value={credential.key}
                            onChange={(e) =>
                              handleCredentialChange(index, "key", e.target.value)
                            }
                            placeholder="e.g., storeHash, accessToken, apiKey"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Label *</Label>
                          <Input
                            value={credential.label}
                            onChange={(e) =>
                              handleCredentialChange(index, "label", e.target.value)
                            }
                            placeholder="e.g., Store Hash, Access Token, API Key"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={credential.description || ""}
                            onChange={(e) =>
                              handleCredentialChange(index, "description", e.target.value)
                            }
                            placeholder="e.g., Your BigCommerce store hash from the URL"
                            className="mt-1"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Field Type</Label>
                            <Select
                              value={credential.type}
                              onValueChange={(value) =>
                                handleCredentialChange(index, "type", value)
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="password">Password</SelectItem>
                                <SelectItem value="url">URL</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-end">
                            <div className="flex items-center space-x-2 pb-2">
                              <Switch
                                id={`required-${index}`}
                                checked={credential.required}
                                onCheckedChange={(checked) =>
                                  handleCredentialChange(index, "required", checked)
                                }
                              />
                              <Label htmlFor={`required-${index}`} className="text-xs">
                                Required
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formData.required_credentials.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border border-white/10 rounded-lg border-dashed">
                  No credentials defined. Click "Add Credential" to add one.
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingPlatform ? "Updating..." : "Creating..."}
                </>
              ) : editingPlatform ? (
                "Update Platform"
              ) : (
                "Create Platform"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EcommerceTab;
