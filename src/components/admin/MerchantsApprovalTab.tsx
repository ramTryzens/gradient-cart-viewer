import { useUser } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, CheckCircle, XCircle, Users } from "lucide-react";

interface User {
  _id: string;
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  isApproved: boolean;
  createdAt: string;
  lastLogin: string;
}

const MerchantsApprovalTab = () => {
  const { user, isLoaded } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      fetchUsers();
    }
  }, [user, isLoaded]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/users');

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    try {
      setUpdatingUserId(userId);

      const response = await fetch(`http://localhost:3001/api/users/${userId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isApproved: !currentStatus,
        }),
      });

      if (response.ok) {
        // Refresh users list
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user approval:', error);
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-sm text-muted-foreground">Total Merchants</p>
              <p className="text-3xl font-bold text-foreground">{users.filter(u => !u.isAdmin).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-3xl font-bold text-foreground">
                {users.filter(u => u.isApproved && !u.isAdmin).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-orange-400" />
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-3xl font-bold text-foreground">
                {users.filter(u => !u.isApproved && !u.isAdmin).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Merchants Table */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Merchants</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage merchant access and approvals
          </p>
        </div>

        <div className="border border-white/10 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-white/5 border-white/10">
                <TableHead className="text-foreground">Name</TableHead>
                <TableHead className="text-foreground">Email</TableHead>
                <TableHead className="text-foreground">Role</TableHead>
                <TableHead className="text-foreground">Status</TableHead>
                <TableHead className="text-foreground">Registered</TableHead>
                <TableHead className="text-foreground">Last Login</TableHead>
                <TableHead className="text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No merchants registered yet
                  </TableCell>
                </TableRow>
              ) : (
                users.map((merchant) => (
                  <TableRow key={merchant._id} className="hover:bg-white/5 border-white/10">
                    <TableCell className="text-foreground font-medium">
                      {merchant.firstName} {merchant.lastName}
                    </TableCell>
                    <TableCell className="text-foreground">{merchant.email}</TableCell>
                    <TableCell>
                      {merchant.isAdmin ? (
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                          Merchant
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {merchant.isApproved ? (
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                          <XCircle className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-foreground text-sm">
                      {new Date(merchant.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-foreground text-sm">
                      {merchant.lastLogin
                        ? new Date(merchant.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      {!merchant.isAdmin && (
                        <Button
                          variant={merchant.isApproved ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleApproval(merchant._id, merchant.isApproved)}
                          disabled={updatingUserId === merchant._id}
                          className={merchant.isApproved ? "" : "bg-green-600 hover:bg-green-700"}
                        >
                          {updatingUserId === merchant._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : merchant.isApproved ? (
                            'Revoke'
                          ) : (
                            'Approve'
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default MerchantsApprovalTab;
