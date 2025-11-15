import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, TrendingUp, Dices, Loader2, Gift, Tag, Percent, DollarSign, Trophy, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SmartOffer {
  offerName?: string;
  discount?: string | number;
  description?: string;
  validUntil?: string;
  category?: string;
  minimumPurchase?: string | number;
  reward_type?: string;
  offer_type?: string;
  offer_value?: number | string;
  reasoning?: string;
  [key: string]: any;
}

interface PromotionCardsProps {
  cartId?: string;
  customerId?: string | number;
  cartTotal?: number;
}

const PromotionCards = ({ cartId, customerId, cartTotal = 0 }: PromotionCardsProps) => {
  const [smartOffers, setSmartOffers] = useState<SmartOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bidding game state
  const [userBid, setUserBid] = useState<string>("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [userWon, setUserWon] = useState(false);
  const [aiBidValue, setAiBidValue] = useState<number | null>(null);
  const [hasBid, setHasBid] = useState(false);

  // Extract ai_bid from offer data
  const extractAiBid = (offer: any) => {
    let offerData = offer.data || offer.Data || offer;

    // If offerData is a string, parse it as JSON
    if (typeof offerData === 'string') {
      try {
        offerData = JSON.parse(offerData);
      } catch (e) {
        console.error('Failed to parse offer data for ai_bid:', e);
        return;
      }
    }

    const aiBid = offerData.ai_bid || offerData.aiBid || offerData.AI_BID;
    if (aiBid !== undefined && aiBid !== null) {
      setAiBidValue(typeof aiBid === 'number' ? aiBid : parseFloat(String(aiBid)));
      console.log('AI Bid extracted:', aiBid);
    }
  };

  // Handle bid submission
  const handleBidSubmit = () => {
    const bidAmount = parseFloat(userBid);

    if (isNaN(bidAmount) || bidAmount <= 0) {
      alert('Please enter a valid bid amount');
      return;
    }

    if (aiBidValue === null) {
      alert('AI bid value not available');
      return;
    }

    if (hasBid) {
      alert('You can only bid once per cart!');
      return;
    }

    // Start spinning
    setHasBid(true);
    setIsSpinning(true);
    setShowResult(false);

    // Simulate spin wheel for 3 seconds
    setTimeout(() => {
      setIsSpinning(false);
      setUserWon(bidAmount > aiBidValue);
      setShowResult(true);
    }, 3000);
  };

  useEffect(() => {
    const fetchSmartOffers = async () => {
      setLoading(true);
      setError(null);
      try {
        // const response = await fetch("https://tryzens-ai.app.n8n.cloud/webhook-test/getSmartOffers", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //     "X-API-Key": "test@123"
        //   },
        //   body: JSON.stringify({
        //     customerId: customerId || 3,
        //     cartId: cartId || "50656685-567c-42c9-9a1e-9389e9f76b68"
        //   })
        // });
        const response = { ok: false, status: 500};

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // Debug: Log the API response
        console.log('Smart Offers API Response:', data);

        // Handle both array and object responses
        if (Array.isArray(data)) {
          console.log('Smart Offers Array:', data);
          setSmartOffers(data);
          // Extract ai_bid from first offer
          if (data.length > 0) {
            extractAiBid(data[0]);
          }
        } else if (data && typeof data === 'object') {
          // If it's a single offer object, wrap it in an array
          console.log('Smart Offers Single Object:', data);
          setSmartOffers([data]);
          extractAiBid(data);
        } else {
          setSmartOffers([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch smart offers");
        console.error("Error fetching smart offers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSmartOffers();
  }, [cartId, customerId]);

  const promotions = [
    {
      id: 1,
      icon: Sparkles,
      title: "Generative Discount",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
    },
    {
      id: 2,
      icon: TrendingUp,
      title: "Join Us, Spend more. Save more",
      description: "Unlock exclusive benefits and greater savings as you shop more. Join our rewards program today."
    },
    {
      id: 3,
      icon: Dices,
      title: "Try Your Luck: Bid against AI",
      description: "Challenge our AI in an exciting bidding game. Win big discounts and special offers."
    }
  ];

  return (
    <div className="space-y-4">
      {promotions.map((promo, index) => {
        const Icon = promo.icon;

        // Special rendering for Generative Discount with API data
        if (promo.id === 1 && (loading || error || smartOffers.length > 0)) {
          return (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors border border-white/10"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-gradient-primary p-3 rounded-lg shrink-0">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {promo.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    AI-powered personalized offers just for you
                  </p>
                </div>
              </div>

              {/* Futuristic AI Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  {/* Main Loader Circle */}
                  <div className="relative w-32 h-32">
                    {/* Outer rotating ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 border-r-pink-500"
                    />
                    {/* Middle rotating ring */}
                    <motion.div
                      animate={{ rotate: -360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-2 rounded-full border-4 border-transparent border-b-pink-500 border-l-orange-500"
                    />
                    {/* Inner rotating ring */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-4 rounded-full border-4 border-transparent border-t-orange-500 border-r-purple-500"
                    />
                    {/* Center pulsing icon */}
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Sparkles className="w-10 h-10 text-purple-400" />
                    </motion.div>
                  </div>

                  {/* Animated text */}
                  <div className="text-center space-y-2">
                    <motion.h3
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent"
                    >
                      AI is analyzing your cart
                    </motion.h3>

                    {/* Loading dots */}
                    <div className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 rounded-full bg-purple-500"
                      />
                      <motion.span
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 rounded-full bg-pink-500"
                      />
                      <motion.span
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 rounded-full bg-orange-500"
                      />
                    </div>

                    {/* Status messages */}
                    <motion.div
                      className="text-sm text-muted-foreground space-y-1 mt-4"
                    >
                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: [0, 1, 1, 0], x: [-20, 0, 0, 20] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                      >
                        ✓ Analyzing cart items
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: [0, 1, 1, 0], x: [-20, 0, 0, 20] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 2, repeatDelay: 4 }}
                      >
                        ✓ Calculating personalized offers
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: [0, 1, 1, 0], x: [-20, 0, 0, 20] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 4, repeatDelay: 4 }}
                      >
                        ✓ Generating AI recommendations
                      </motion.p>
                    </motion.div>
                  </div>

                  {/* Particle effects */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{
                          y: [0, -100],
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          delay: i * 0.5,
                          ease: "easeOut"
                        }}
                        className="absolute"
                        style={{
                          left: `${20 + i * 15}%`,
                          top: '50%'
                        }}
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          i % 3 === 0 ? 'bg-purple-500' :
                          i % 3 === 1 ? 'bg-pink-500' :
                          'bg-orange-500'
                        }`} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-destructive text-sm">Error: {error}</p>
                </div>
              )}

              {/* Smart Offers Display */}
              {!loading && !error && smartOffers.length > 0 && (
                <div className="space-y-3 mt-4">
                  {smartOffers.map((offer, offerIndex) => (
                    <motion.div
                      key={offerIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * offerIndex }}
                      className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20 backdrop-blur-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg shrink-0">
                          <Gift className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 space-y-3">
                          {/* Offer Summary */}
                          {(() => {
                            let offerData = offer.data || offer.Data || offer;

                            // If offerData is a string, parse it as JSON
                            if (typeof offerData === 'string') {
                              try {
                                offerData = JSON.parse(offerData);
                              } catch (e) {
                                console.error('Failed to parse offer data:', e);
                              }
                            }

                            const offerName = offerData.offerName || offerData.offer_name || offerData.name;
                            const offerValue = offerData.offer_value || offerData.offerValue || offerData.OfferValue;

                            return offerName ? (
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-base font-bold text-foreground">
                                  {offerName}
                                </h4>
                                {offerValue && (
                                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shrink-0">
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    {typeof offerValue === 'number'
                                      ? offerValue.toFixed(2)
                                      : offerValue}
                                  </Badge>
                                )}
                              </div>
                            ) : null;
                          })()}

                          {/* AI Offer Details Table */}
                          <div className="bg-black/20 rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-white/10 hover:bg-white/5">
                                  <TableHead className="text-purple-300 font-semibold">Field</TableHead>
                                  <TableHead className="text-purple-300 font-semibold">Value</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(() => {
                                  // Check if data is nested inside a 'data' field
                                  let offerData = offer.data || offer.Data || offer;

                                  // If offerData is a string, parse it as JSON
                                  if (typeof offerData === 'string') {
                                    try {
                                      offerData = JSON.parse(offerData);
                                      console.log('Parsed JSON data:', offerData);
                                    } catch (e) {
                                      console.error('Failed to parse offer data as JSON:', e);
                                    }
                                  }

                                  // Get all keys from the offer object
                                  const allKeys = Object.keys(offerData);

                                  // Field mapping - looking for these specific fields with various naming patterns
                                  const fieldMapping = {
                                    'reward_type': ['reward_type', 'rewardType', 'RewardType', 'reward-type', 'reward', 'type'],
                                    'offer_type': ['offer_type', 'offerType', 'OfferType', 'offer-type', 'type', 'offer'],
                                    'offer_value': ['offer_value', 'offerValue', 'OfferValue', 'offer-value', 'value', 'discount', 'amount', 'price'],
                                    'reasoning': ['reasoning', 'Reasoning', 'reason', 'Reason', 'description', 'desc', 'explanation']
                                  };

                                  // Debug: Log what keys are available
                                  console.log('Available keys in offerData:', allKeys.slice(0, 20)); // Show first 20 keys
                                  console.log('Total keys:', allKeys.length);

                                  // Find the actual field names in the offer object
                                  const getValue = (possibleNames: string[]) => {
                                    for (const name of possibleNames) {
                                      if (offerData[name] !== undefined && offerData[name] !== null && offerData[name] !== '') {
                                        return offerData[name];
                                      }
                                    }
                                    return null;
                                  };

                                  const rewardType = getValue(fieldMapping.reward_type);
                                  const offerType = getValue(fieldMapping.offer_type);
                                  const offerValue = getValue(fieldMapping.offer_value);
                                  const reasoning = getValue(fieldMapping.reasoning);

                                  const rows = [];

                                  // Add rows for found fields
                                  if (rewardType) {
                                    rows.push(
                                      <TableRow key="reward_type" className="border-white/10 hover:bg-white/5">
                                        <TableCell className="font-medium text-foreground">Reward Type</TableCell>
                                        <TableCell className="text-foreground">{String(rewardType)}</TableCell>
                                      </TableRow>
                                    );
                                  }

                                  if (offerType) {
                                    rows.push(
                                      <TableRow key="offer_type" className="border-white/10 hover:bg-white/5">
                                        <TableCell className="font-medium text-foreground">Offer Type</TableCell>
                                        <TableCell className="text-foreground">{String(offerType)}</TableCell>
                                      </TableRow>
                                    );
                                  }

                                  if (offerValue !== null) {
                                    rows.push(
                                      <TableRow key="offer_value" className="border-white/10 hover:bg-white/5">
                                        <TableCell className="font-medium text-foreground">Offer Value</TableCell>
                                        <TableCell className="text-foreground font-bold">
                                          ${typeof offerValue === 'number'
                                            ? offerValue.toFixed(2)
                                            : offerValue}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }

                                  if (reasoning) {
                                    rows.push(
                                      <TableRow key="reasoning" className="border-white/10 hover:bg-white/5">
                                        <TableCell className="font-medium text-foreground align-top">Reasoning</TableCell>
                                        <TableCell className="text-muted-foreground text-sm leading-relaxed">
                                          {String(reasoning)}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }

                                  // Add Final Offer Value
                                  if (cartTotal > 0 && offerValue !== null) {
                                    const numericOfferValue = typeof offerValue === 'number'
                                      ? offerValue
                                      : parseFloat(String(offerValue)) || 0;

                                    rows.push(
                                      <TableRow key="final_offer_value" className="border-white/10 hover:bg-white/5 bg-green-500/10">
                                        <TableCell className="font-medium text-foreground">Final Offer Value</TableCell>
                                        <TableCell className="text-green-400 font-bold text-lg">
                                          ${(cartTotal - numericOfferValue).toFixed(2)}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }

                                  // If no matching fields found, show message with debug info
                                  if (rows.length === 0) {
                                    return (
                                      <TableRow className="border-white/10">
                                        <TableCell colSpan={2} className="text-center py-8">
                                          <p className="text-muted-foreground mb-4">
                                            Could not find expected fields (reward_type, offer_type, offer_value, reasoning)
                                          </p>
                                          <details className="text-xs">
                                            <summary className="cursor-pointer text-purple-300 mb-2">
                                              View available fields (Total: {allKeys.length})
                                            </summary>
                                            <div className="mt-2 text-left bg-black/40 rounded p-3 max-h-60 overflow-auto">
                                              <p className="text-foreground mb-2 font-semibold">Available field names:</p>
                                              <pre className="text-muted-foreground text-xs">
                                                {allKeys.join('\n')}
                                              </pre>
                                            </div>
                                          </details>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  }

                                  return rows;
                                })()}
                              </TableBody>
                            </Table>
                          </div>

                          {/* View AI Offer Details - Show All Fields */}
                          <details className="mt-3">
                            <summary className="text-xs text-purple-300 cursor-pointer hover:text-purple-200 font-medium">
                              View AI Offer
                            </summary>
                            <div className="mt-2 bg-black/20 rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-white/10 hover:bg-white/5">
                                    <TableHead className="text-purple-300 font-semibold">Field</TableHead>
                                    <TableHead className="text-purple-300 font-semibold">Value</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {(() => {
                                    // Check if data is nested inside a 'data' field
                                    let offerData = offer.data || offer.Data || offer;

                                    // If offerData is a string, parse it as JSON
                                    if (typeof offerData === 'string') {
                                      try {
                                        offerData = JSON.parse(offerData);
                                      } catch (e) {
                                        console.error('Failed to parse offer data in View AI Offer:', e);
                                      }
                                    }

                                    const displayFields = [
                                      { key: 'reward_type', label: 'Reward Type', value: offerData.reward_type || offerData.rewardType || offerData.RewardType },
                                      { key: 'offer_type', label: 'Offer Type', value: offerData.offer_type || offerData.offerType || offerData.OfferType },
                                      { key: 'offer_value', label: 'Offer Value', value: offerData.offer_value || offerData.offerValue || offerData.OfferValue },
                                      { key: 'reasoning', label: 'Reasoning', value: offerData.reasoning || offerData.Reasoning },
                                    ];

                                    const rows = displayFields
                                      .filter(field => field.value !== undefined && field.value !== null && field.value !== '')
                                      .map(field => (
                                        <TableRow key={field.key} className="border-white/10 hover:bg-white/5">
                                          <TableCell className="font-medium text-foreground">{field.label}</TableCell>
                                          <TableCell className="text-foreground">
                                            {field.key === 'offer_value'
                                              ? `$${typeof field.value === 'number' ? field.value.toFixed(2) : field.value}`
                                              : String(field.value)}
                                          </TableCell>
                                        </TableRow>
                                      ));

                                    // Add Final Offer Value row
                                    const offerValue = offerData.offer_value || offerData.offerValue || offerData.OfferValue;
                                    if (cartTotal > 0 && offerValue) {
                                      rows.push(
                                        <TableRow key="final_offer_value" className="border-white/10 hover:bg-white/5 bg-green-500/10">
                                          <TableCell className="font-medium text-foreground">Final Offer Value</TableCell>
                                          <TableCell className="text-green-400 font-bold text-lg">
                                            ${(cartTotal - (typeof offerValue === 'number'
                                              ? offerValue
                                              : parseFloat(String(offerValue)) || 0)).toFixed(2)}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    }

                                    // If no fields found, show message
                                    if (rows.length === 0) {
                                      return (
                                        <TableRow className="border-white/10">
                                          <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                                            <div className="mb-2">No offer details available</div>
                                            <details className="text-xs">
                                              <summary className="cursor-pointer">View raw data</summary>
                                              <pre className="mt-2 text-left bg-black/20 rounded p-2 overflow-auto max-h-40">
                                                {JSON.stringify(offerData, null, 2)}
                                              </pre>
                                            </details>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    }

                                    return rows;
                                  })()}
                                </TableBody>
                              </Table>
                            </div>
                          </details>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {!loading && !error && smartOffers.length === 0 && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No smart offers available at the moment
                </div>
              )}
            </motion.div>
          );
        }

        // Special rendering for Try Your Luck - Bid against AI
        if (promo.id === 3) {
          return (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors border border-white/10"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-gradient-primary p-3 rounded-lg shrink-0">
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {promo.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                    This is one time Bid for your cart against AI. Try your luck to see if you can unlock a personalized bid.
                  </p>
                </div>
              </div>

              {/* Bidding Interface */}
              {!hasBid && (
                <div className="space-y-3">
                  <Input
                    type="number"
                    placeholder="Enter your bid amount"
                    value={userBid}
                    onChange={(e) => setUserBid(e.target.value)}
                    className="bg-white/10 border-white/20 text-foreground placeholder:text-muted-foreground"
                    disabled={aiBidValue === null}
                  />
                  <Button
                    onClick={handleBidSubmit}
                    disabled={aiBidValue === null || !userBid}
                    className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white font-semibold py-3"
                  >
                    <Dices className="w-5 h-5 mr-2" />
                    Bid and Win against AI
                  </Button>
                  {aiBidValue === null && (
                    <p className="text-xs text-muted-foreground text-center">
                      Loading AI bid data...
                    </p>
                  )}
                </div>
              )}

              {/* Spin Wheel Animation */}
              <AnimatePresence>
                {isSpinning && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, rotate: 1440 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                        className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center"
                      >
                        <div className="w-28 h-28 rounded-full bg-gradient-bg flex items-center justify-center">
                          <Dices className="w-12 h-12 text-foreground" />
                        </div>
                      </motion.div>
                    </div>
                    <p className="text-foreground font-semibold mt-6 text-lg">
                      Spinning the wheel...
                    </p>
                    <p className="text-muted-foreground text-sm mt-2">
                      Let's see if you beat the AI!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Result Display */}
              <AnimatePresence>
                {showResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`mt-4 p-6 rounded-lg border-2 ${
                      userWon
                        ? 'bg-green-500/10 border-green-500/50'
                        : 'bg-red-500/10 border-red-500/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {userWon ? (
                        <Trophy className="w-8 h-8 text-green-400" />
                      ) : (
                        <XCircle className="w-8 h-8 text-red-400" />
                      )}
                      <h4 className={`text-xl font-bold ${
                        userWon ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {userWon ? 'Hurray! You Won!' : 'AI Won This Round!'}
                      </h4>
                    </div>

                    {userWon ? (
                      <div className="space-y-2">
                        <p className="text-foreground">
                          Congratulations! You have won the bid against AI!
                        </p>
                        <p className="text-lg font-bold text-green-400">
                          Your cart total is now ${parseFloat(userBid).toFixed(2)}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-foreground mb-3">
                          Sorry, AI won the bid against your bid. Please try again with your next order!
                        </p>
                        <div className="bg-white/5 rounded-lg p-4 space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Your Bid:</span>
                            <span className="text-foreground font-semibold">${parseFloat(userBid).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">AI Bid:</span>
                            <span className="text-foreground font-semibold">${aiBidValue?.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        }

        // Regular rendering for other promotions
        return (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="bg-white/5 rounded-xl p-6 hover:bg-white/10 transition-colors border border-white/10"
          >
            <div className="flex items-start gap-4">
              <div className="bg-gradient-primary p-3 rounded-lg shrink-0">
                <Icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {promo.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {promo.description}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default PromotionCards;
