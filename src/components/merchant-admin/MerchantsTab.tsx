import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import {
  getMerchantByUserId,
  createMerchant,
  updateMerchant,
  updateMerchantStore,
  deleteMerchant,
  getEcommerceDetails,
  getRules,
  type Merchant,
} from "@/lib/api";

const MerchantsTab = () => {
  const queryClient = useQueryClient();
  const { user, isLoaded } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [editingStoreIndex, setEditingStoreIndex] = useState<number | null>(null);
  const [currentUserMerchant, setCurrentUserMerchant] = useState<Merchant | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    storeName: "",
    platform: "",
    platformId: "",
    hostName: "",
    storeDetails: {} as Record<string, string>,
    selectedRules: {} as Record<string, boolean | number>,
    apiKey: "",
    apiSecret: "",
  });
  const [showApiSecret, setShowApiSecret] = useState(false);

  // Fetch data - only fetch current user's merchant
  const { data: merchants, isLoading: loadingMerchants } = useQuery({
    queryKey: ["merchants", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const merchant = await getMerchantByUserId(user.id);
        return [merchant];
      } catch (error) {
        return [];
      }
    },
    enabled: !!user?.id,
  });

  const { data: platforms, isLoading: loadingPlatforms } = useQuery({
    queryKey: ["ecommerce-details"],
    queryFn: getEcommerceDetails,
  });

  const { data: rules, isLoading: loadingRules } = useQuery({
    queryKey: ["rules"],
    queryFn: getRules,
  });

  // Get selected platform's credential requirements
  const selectedPlatform = platforms?.find((p) => p.name === formData.platform);

  // Fetch current user's merchant info on mount
  useEffect(() => {
    const fetchCurrentUserMerchant = async () => {
      if (!isLoaded || !user) return;

      try {
        const merchant = await getMerchantByUserId(user.id);
        setCurrentUserMerchant(merchant);
        console.log('Current user merchant loaded:', merchant._id, 'with', merchant.stores?.length || 0, 'stores');
      } catch (error) {
        console.log('No merchant found for current user, they may need to create one');
        setCurrentUserMerchant(null);
      }
    };

    fetchCurrentUserMerchant();
  }, [user, isLoaded]);

  // Update currentUserMerchant when merchants data changes
  useEffect(() => {
    if (merchants && merchants.length > 0) {
      setCurrentUserMerchant(merchants[0]);
      console.log('Updated currentUserMerchant from query:', merchants[0]._id);
    }
  }, [merchants]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createMerchant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchants", user?.id] });
      toast.success("Store created successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create store");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Merchant> }) =>
      updateMerchant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchants", user?.id] });
      toast.success("Store added successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add store");
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: ({ id, storeIndex, storeData }: { id: string; storeIndex: number; storeData: any }) =>
      updateMerchantStore(id, storeIndex, storeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchants", user?.id] });
      toast.success("Store updated successfully");
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update store");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMerchant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchants", user?.id] });
      toast.success("Store deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete store");
    },
  });

  const handleOpenDialog = (merchant?: Merchant, storeIndex?: number) => {
    if (merchant && storeIndex !== undefined) {
      // Editing an existing store
      setEditingMerchant(merchant);
      setEditingStoreIndex(storeIndex);
      const store = merchant.stores?.[storeIndex];
      setFormData({
        name: merchant.businessName || merchant.name || merchant.email,
        storeName: store?.storeName || "",
        platform: store?.platform || "",
        platformId: store?.platformId || "",
        hostName: (store as any)?.hostName || "",
        storeDetails: store?.storeDetails || {},
        selectedRules: store?.businessRules || {},
        apiKey: (store as any)?.apiKey || "",
        apiSecret: (store as any)?.apiSecret || "",
      });
    } else {
      // Adding a new store
      setEditingMerchant(null);
      setEditingStoreIndex(null);
      setFormData({
        name: currentUserMerchant?.businessName || currentUserMerchant?.name || currentUserMerchant?.email || user?.primaryEmailAddress?.emailAddress || "",
        storeName: "",
        platform: "",
        platformId: "",
        hostName: "",
        storeDetails: {},
        selectedRules: {},
        apiKey: "",
        apiSecret: "",
      });
    }
    setShowApiSecret(false);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMerchant(null);
    setEditingStoreIndex(null);
    setFormData({
      name: "",
      storeName: "",
      platform: "",
      platformId: "",
      hostName: "",
      storeDetails: {},
      selectedRules: {},
      apiKey: "",
      apiSecret: "",
    });
    setShowApiSecret(false);
  };

  const handleRuleToggle = (ruleKey: string, ruleValue: boolean | number, checked: boolean) => {
    setFormData((prev) => {
      const newRules = { ...prev.selectedRules };
      if (checked) {
        newRules[ruleKey] = ruleValue;
      } else {
        delete newRules[ruleKey];
      }
      console.log('Updated selectedRules:', newRules);
      return { ...prev, selectedRules: newRules };
    });
  };

  const handleRuleValueChange = (ruleKey: string, newValue: string, valueType: string) => {
    let processedValue: string | number | boolean = newValue;

    // Handle different value types
    if (valueType === 'number') {
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue) && numValue >= 0) {
        processedValue = numValue;
      } else {
        return; // Don't update if invalid number
      }
    } else if (valueType === 'string') {
      processedValue = newValue;
    }

    setFormData((prev) => ({
      ...prev,
      selectedRules: {
        ...prev.selectedRules,
        [ruleKey]: processedValue,
      },
    }));
  };

  const handlePlatformChange = (platformName: string) => {
    const platform = platforms?.find((p) => p.name === platformName);
    // Set hostname based on platform
    const hostName = platformName.toLowerCase().includes('bigcommerce')
      ? 'https://api.bigcommerce.com'
      : '';
    // Reset storeDetails when platform changes
    setFormData((prev) => ({
      ...prev,
      platform: platformName,
      platformId: platform?._id || "",
      hostName: hostName,
      storeDetails: {},
    }));
  };

  const handleCredentialChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      storeDetails: {
        ...prev.storeDetails,
        [key]: value,
      },
    }));
  };

  const generateApiSecret = () => {
    // Generate a random 32-character secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, apiSecret: secret }));
    toast.success("API Secret generated successfully");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied to clipboard`);
    }).catch(() => {
      toast.error("Failed to copy to clipboard");
    });
  };

  const maskSecret = (secret: string) => {
    if (!secret || secret.length <= 4) return secret;
    return '•'.repeat(secret.length - 4) + secret.slice(-4);
  };

  const handleSubmit = () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    if (!formData.storeName || !formData.platform) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.hostName) {
      toast.error("Please enter a Host Name");
      return;
    }

    if (!formData.apiKey) {
      toast.error("Please enter an API Key");
      return;
    }

    if (!formData.apiSecret) {
      toast.error("Please enter or generate an API Secret");
      return;
    }

    const userEmail = user?.primaryEmailAddress?.emailAddress || currentUserMerchant?.email || "";
    if (!userEmail) {
      toast.error("User email is required");
      return;
    }

    // Validate required credentials
    if (selectedPlatform?.required_credentials) {
      for (const credential of selectedPlatform.required_credentials) {
        if (credential.required && !formData.storeDetails[credential.key]) {
          toast.error(`Please fill in the required field: ${credential.label}`);
          return;
        }
      }
    }

    if (Object.keys(formData.storeDetails).length === 0) {
      toast.error("Please fill in at least one store credential");
      return;
    }

    if (Object.keys(formData.selectedRules).length === 0) {
      toast.error("Please select at least one business rule");
      return;
    }

    // Create store object
    const store = {
      storeName: formData.storeName,
      platform: formData.platform,
      platformId: formData.platformId,
      hostName: formData.hostName,
      storeDetails: formData.storeDetails,
      apiKey: formData.apiKey,
      apiSecret: formData.apiSecret,
      businessRules: formData.selectedRules,
    };

    // Use formData.name if available, otherwise fall back to email
    const businessName = formData.name || userEmail;

    const merchantData = {
      userId: user.id,
      businessName: businessName,
      email: userEmail,
      name: businessName, // Keep for backward compatibility
      stores: [store], // For now, creating merchant with one store
    };

    console.log('Submitting merchant data:', JSON.stringify(merchantData, null, 2));

    // Check if we're editing an existing store
    if (editingMerchant && editingStoreIndex !== null) {
      // Update existing store
      console.log('Updating store at index:', editingStoreIndex, 'for merchant:', editingMerchant._id);
      updateStoreMutation.mutate({
        id: editingMerchant._id,
        storeIndex: editingStoreIndex,
        storeData: store
      });
    } else {
      // Adding a new store or creating a new merchant
      const existingMerchantId = currentUserMerchant?._id;

      if (existingMerchantId) {
        console.log('Adding new store to existing merchant:', existingMerchantId);
        console.log('Current merchant has', currentUserMerchant?.stores?.length || 0, 'stores');
        updateMutation.mutate({ id: existingMerchantId, data: merchantData });
      } else {
        console.log('Creating new merchant for user:', user.id);
        createMutation.mutate(merchantData);
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this merchant and all its store configurations?")) {
      deleteMutation.mutate(id);
    }
  };

  if (loadingMerchants || loadingPlatforms || loadingRules) {
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
          <h2 className="text-2xl font-bold text-foreground">Store Configurations</h2>
          <p className="text-sm text-muted-foreground">
            Manage your store configurations with platform credentials and business rules
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Store
        </Button>
      </div>

      <div className="border border-white/10 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-white/5 border-white/10">
              <TableHead className="text-foreground">Store Name</TableHead>
              <TableHead className="text-foreground">Platform</TableHead>
              <TableHead className="text-foreground">Credentials</TableHead>
              <TableHead className="text-foreground">Business Rules</TableHead>
              <TableHead className="text-foreground text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {merchants?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No stores found. Add your first store to get started.
                </TableCell>
              </TableRow>
            ) : (
              merchants?.flatMap((merchant) =>
                merchant.stores?.map((store, storeIndex) => (
                <TableRow key={store.storeId} className="hover:bg-white/5 border-white/10">
                  <TableCell className="font-medium text-foreground">
                    {store.storeName}
                  </TableCell>
                  <TableCell className="text-foreground">
                    {store.platform}
                  </TableCell>
                  <TableCell className="text-foreground">
                    <div className="flex flex-wrap gap-1">
                      {store.storeDetails && Object.keys(store.storeDetails).length > 0 ? (
                        Object.keys(store.storeDetails)
                          .slice(0, 2)
                          .map((key) => (
                            <span
                              key={key}
                              className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
                            >
                              {key}
                            </span>
                          ))
                      ) : (
                        <span className="text-muted-foreground italic text-xs">
                          No credentials
                        </span>
                      )}
                      {store.storeDetails && Object.keys(store.storeDetails).length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{Object.keys(store.storeDetails).length - 2} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">
                    <div className="flex flex-wrap gap-1">
                      {store.businessRules && Object.entries(store.businessRules)
                        .slice(0, 3)
                        .map(([key, value]) => (
                          <span
                            key={key}
                            className="text-xs bg-primary/20 text-primary px-2 py-1 rounded"
                          >
                            {key}: {String(value)}
                          </span>
                        ))}
                      {store.businessRules && Object.keys(store.businessRules).length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{Object.keys(store.businessRules).length - 3} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(merchant, storeIndex)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(merchant._id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                )) || []
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMerchant ? "Edit Store Configuration" : "Add New Store Configuration"}
            </DialogTitle>
            <DialogDescription>
              {editingMerchant
                ? "Update store configuration, platform credentials, and business rules"
                : "Create a new store configuration for a merchant with platform credentials and business rules"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Merchant Name *</Label>
              <Input
                id="name"
                value={formData.name || user?.primaryEmailAddress?.emailAddress || ""}
                disabled
                placeholder="Your business name or email"
                className="bg-muted/50 cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                This store will be added to your merchant account. The merchant name will be set to your email if not configured.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name *</Label>
              <Input
                id="storeName"
                value={formData.storeName}
                onChange={(e) =>
                  setFormData({ ...formData, storeName: e.target.value })
                }
                placeholder="e.g., ACME Main Store"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Platform *</Label>
              <Select
                value={formData.platform}
                onValueChange={handlePlatformChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a platform" />
                </SelectTrigger>
                <SelectContent>
                  {platforms
                    ?.filter((p) => p.enabled)
                    .map((platform) => (
                      <SelectItem key={platform._id} value={platform.name}>
                        {platform.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Host Name Field */}
            <div className="space-y-2">
              <Label htmlFor="hostName">Host Name *</Label>
              <Input
                id="hostName"
                type="text"
                value={formData.hostName}
                onChange={(e) =>
                  setFormData({ ...formData, hostName: e.target.value })
                }
                placeholder="e.g., https://api.yourplatform.com"
                disabled={formData.platform.toLowerCase().includes('bigcommerce')}
                className={formData.platform.toLowerCase().includes('bigcommerce') ? 'bg-muted/50 cursor-not-allowed' : ''}
              />
              {formData.platform.toLowerCase().includes('bigcommerce') && (
                <p className="text-xs text-muted-foreground">
                  BigCommerce platform uses the default host: https://api.bigcommerce.com
                </p>
              )}
            </div>

            {/* Dynamic Credential Fields */}
            {selectedPlatform && selectedPlatform.required_credentials && selectedPlatform.required_credentials.length > 0 && (
              <div className="space-y-3 border border-white/10 rounded-lg p-4">
                <Label>Store Credentials *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Provide the required credentials for {selectedPlatform.name}
                </p>
                {selectedPlatform.required_credentials.map((credential) => (
                  <div key={credential.key} className="space-y-2">
                    <Label htmlFor={credential.key}>
                      {credential.label}
                      {credential.required && <span className="text-red-400 ml-1">*</span>}
                    </Label>
                    {credential.description && (
                      <p className="text-xs text-muted-foreground mb-1">
                        {credential.description}
                      </p>
                    )}
                    <Input
                      id={credential.key}
                      type={credential.type === 'password' ? 'password' : 'text'}
                      value={formData.storeDetails[credential.key] || ""}
                      onChange={(e) =>
                        handleCredentialChange(credential.key, e.target.value)
                      }
                      placeholder={`Enter ${credential.label.toLowerCase()}`}
                      required={credential.required}
                    />
                  </div>
                ))}
              </div>
            )}

            {formData.platform && (!selectedPlatform?.required_credentials || selectedPlatform.required_credentials.length === 0) && (
              <div className="text-center py-4 text-muted-foreground text-sm border border-white/10 rounded-lg border-dashed">
                No credentials required for this platform
              </div>
            )}

            {/* API Key and API Secret Fields */}
            <div className="space-y-3 border border-white/10 rounded-lg p-4 bg-white/5">
              <Label className="text-base">API Credentials *</Label>
              <p className="text-xs text-muted-foreground mb-2">
                API Key and Secret for authenticating requests to this store
              </p>

              {/* API Key */}
              <div className="space-y-2">
                <Label htmlFor="apiKey">
                  API Key <span className="text-red-400 ml-1">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="text"
                    value={formData.apiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, apiKey: e.target.value })
                    }
                    placeholder="X-API-KEY"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(formData.apiKey, "API Key")}
                    disabled={!formData.apiKey}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* API Secret */}
              <div className="space-y-2">
                <Label htmlFor="apiSecret">
                  API Secret <span className="text-red-400 ml-1">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="apiSecret"
                      type={showApiSecret ? "text" : "password"}
                      value={showApiSecret ? formData.apiSecret : maskSecret(formData.apiSecret)}
                      onChange={(e) => {
                        // Only allow changes in visible mode
                        if (showApiSecret) {
                          setFormData({ ...formData, apiSecret: e.target.value });
                        }
                      }}
                      placeholder="X-API-SECRET"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowApiSecret(!showApiSecret)}
                      className="absolute right-0 top-0 h-full"
                    >
                      {showApiSecret ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generateApiSecret}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(formData.apiSecret, "API Secret")}
                    disabled={!formData.apiSecret}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.apiSecret
                    ? `Last 4 digits: ${formData.apiSecret.slice(-4)}`
                    : "Click the refresh button to generate a secure secret"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business Rules * (Select at least one)</Label>
              <div className="border border-white/10 rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
                {!rules || rules.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No business rules available. Please create rules first in the Rules tab.
                  </div>
                ) : (
                  rules.map((rule) => {
                    const isChecked = formData.selectedRules[rule.key] !== undefined;
                    console.log(`Rule ${rule.key} checked state:`, isChecked, formData.selectedRules);

                    return (
                      <div
                        key={rule._id}
                        className="flex items-start gap-3 p-3 rounded border border-white/10 hover:bg-white/5 hover:border-white/20 transition-colors"
                      >
                        <Checkbox
                          id={`rule-${rule._id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const ruleValue = rule.value !== undefined ? rule.value : rule.enabled;
                            console.log('Checkbox onCheckedChange:', rule.key, 'checked=', checked, 'ruleValue=', ruleValue);
                            handleRuleToggle(rule.key, ruleValue, checked === true);
                          }}
                          className="mt-1"
                        />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`rule-${rule._id}`}
                            className="font-medium text-sm cursor-pointer"
                          >
                            {rule.key}
                          </label>
                          {typeof rule.value === "number" &&
                            formData.selectedRules[rule.key] !== undefined && (
                              <Input
                                type="number"
                                min="0"
                                value={
                                  typeof formData.selectedRules[rule.key] === "number"
                                    ? (formData.selectedRules[rule.key] as number)
                                    : rule.value
                                }
                                onChange={(e) =>
                                  handleRuleValueChange(rule.key, e.target.value, "number")
                                }
                                className="w-24 h-7 text-xs"
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                          {typeof rule.value === "string" &&
                            formData.selectedRules[rule.key] !== undefined && (
                              <Input
                                type="text"
                                value={
                                  typeof formData.selectedRules[rule.key] === "string"
                                    ? (formData.selectedRules[rule.key] as string)
                                    : rule.value
                                }
                                onChange={(e) =>
                                  handleRuleValueChange(rule.key, e.target.value, "string")
                                }
                                className="w-48 h-7 text-xs"
                                placeholder="Enter string value"
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                        </div>
                        {rule.description && (
                          <p className="text-xs text-muted-foreground">
                            {rule.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Default: {String(rule.value !== undefined ? rule.value : rule.enabled)} ({typeof (rule.value !== undefined ? rule.value : rule.enabled)})
                        </p>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || updateStoreMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending || updateStoreMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingMerchant && editingStoreIndex !== null ? "Updating..." : editingMerchant ? "Adding..." : "Creating..."}
                </>
              ) : editingMerchant && editingStoreIndex !== null ? (
                "Update Store"
              ) : (
                "Add Store"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MerchantsTab;
