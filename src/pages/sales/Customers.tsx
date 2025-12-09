import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Users, 
  TrendingUp, 
  Calendar,
  Mail,
  Phone,
  Building2,
  ArrowRight,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";

interface Customer {
  id: string;
  name: string;
  type: "new" | "existing";
  industry: string;
  totalArr: string;
  activeDeals: number;
  closedDeals: number;
  lastActivity: string;
  primaryContact: {
    name: string;
    title: string;
    email: string;
    phone: string;
  };
  relationshipStart?: string;
  renewalDate?: string;
}

const customers: Customer[] = [
  {
    id: "1",
    name: "Meridian Software",
    type: "new",
    industry: "Technology",
    totalArr: "$85K",
    activeDeals: 1,
    closedDeals: 0,
    lastActivity: "2 days ago",
    primaryContact: {
      name: "Sarah Mitchell",
      title: "VP of Operations",
      email: "s.mitchell@meridian.io",
      phone: "(555) 234-5678",
    },
  },
  {
    id: "2",
    name: "Cascade Analytics",
    type: "new",
    industry: "Data & Analytics",
    totalArr: "$62K",
    activeDeals: 1,
    closedDeals: 0,
    lastActivity: "Yesterday",
    primaryContact: {
      name: "Michael Chen",
      title: "Director of Procurement",
      email: "m.chen@cascade.com",
      phone: "(555) 345-6789",
    },
  },
  {
    id: "3",
    name: "Northwind Traders",
    type: "existing",
    industry: "Retail",
    totalArr: "$45K",
    activeDeals: 1,
    closedDeals: 2,
    lastActivity: "3 days ago",
    primaryContact: {
      name: "Emily Rodriguez",
      title: "IT Director",
      email: "e.rodriguez@northwind.com",
      phone: "(555) 456-7890",
    },
    relationshipStart: "Jan 2023",
    renewalDate: "Jan 10, 2025",
  },
  {
    id: "4",
    name: "Alpine Industries",
    type: "new",
    industry: "Manufacturing",
    totalArr: "$38K",
    activeDeals: 1,
    closedDeals: 0,
    lastActivity: "1 day ago",
    primaryContact: {
      name: "David Park",
      title: "CFO",
      email: "d.park@alpine-ind.com",
      phone: "(555) 567-8901",
    },
  },
  {
    id: "5",
    name: "Summit Healthcare",
    type: "existing",
    industry: "Healthcare",
    totalArr: "$57K",
    activeDeals: 1,
    closedDeals: 1,
    lastActivity: "Today",
    primaryContact: {
      name: "Jennifer Walsh",
      title: "Chief Compliance Officer",
      email: "j.walsh@summithealth.org",
      phone: "(555) 678-9012",
    },
    relationshipStart: "Mar 2024",
    renewalDate: "Mar 15, 2025",
  },
];

const customerStats = {
  total: 5,
  newCustomers: 3,
  existingCustomers: 2,
  totalPipelineValue: "$287K",
};

export default function Customers() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold">My Customers</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Relationships and account history
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Accounts</p>
                <p className="text-3xl font-semibold mt-1">{customerStats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Prospects</p>
                <p className="text-3xl font-semibold mt-1">{customerStats.newCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Existing Customers</p>
                <p className="text-3xl font-semibold mt-1">{customerStats.existingCustomers}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-status-success/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
                <p className="text-3xl font-semibold mt-1">{customerStats.totalPipelineValue}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/30">
            <tr className="text-left text-sm text-muted-foreground">
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Industry</th>
              <th className="px-6 py-4 font-medium">Total ARR</th>
              <th className="px-6 py-4 font-medium">Active Deals</th>
              <th className="px-6 py-4 font-medium">Last Activity</th>
              <th className="px-6 py-4 font-medium w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((customer) => (
              <tr 
                key={customer.id} 
                className="hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => setSelectedCustomer(customer)}
              >
                <td className="px-6 py-4">
                  <div>
                    <span className="font-medium text-foreground">{customer.name}</span>
                    <Badge 
                      variant="outline" 
                      className={`ml-2 text-xs ${
                        customer.type === "new" 
                          ? "bg-primary/10 text-primary border-primary/20" 
                          : "bg-status-success/10 text-status-success border-status-success/20"
                      }`}
                    >
                      {customer.type === "new" ? "Prospect" : "Customer"}
                    </Badge>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-foreground">{customer.industry}</td>
                <td className="px-6 py-4 font-medium">{customer.totalArr}</td>
                <td className="px-6 py-4 text-sm">{customer.activeDeals}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{customer.lastActivity}</td>
                <td className="px-6 py-4">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Modal */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl">{selectedCustomer.name}</DialogTitle>
                    <p className="text-muted-foreground mt-1">
                      {selectedCustomer.industry}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">{selectedCustomer.primaryContact.name}</p>
                    <p className="text-muted-foreground">{selectedCustomer.primaryContact.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs">
                      <Mail className="h-3 w-3" />
                      <span>{selectedCustomer.primaryContact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Phone className="h-3 w-3" />
                      <span>{selectedCustomer.primaryContact.phone}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-6 mt-6">
                {/* Left Column - Metrics */}
                <div className="space-y-4">
                  <Card className="border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Account Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total ARR</span>
                        <span className="font-semibold">{selectedCustomer.totalArr}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active Deals</span>
                        <span>{selectedCustomer.activeDeals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Closed Deals</span>
                        <span>{selectedCustomer.closedDeals}</span>
                      </div>
                      {selectedCustomer.relationshipStart && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Customer Since</span>
                          <span>{selectedCustomer.relationshipStart}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {selectedCustomer.renewalDate && (
                    <Card className="border-border border-status-warning/30 bg-status-warning/5">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-status-warning" />
                          <span className="text-sm font-medium">Renewal Due</span>
                        </div>
                        <p className="text-lg font-semibold mt-1">{selectedCustomer.renewalDate}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Right Column - Recent Activity */}
                <div>
                  <Card className="border-border h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Deal History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedCustomer.closedDeals > 0 ? (
                        <div className="space-y-3">
                          {selectedCustomer.closedDeals > 0 && (
                            <div className="p-3 bg-muted/30 rounded-lg">
                              <p className="text-sm font-medium">Previous Contracts</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {selectedCustomer.closedDeals} closed deal{selectedCustomer.closedDeals > 1 ? "s" : ""}
                              </p>
                            </div>
                          )}
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm font-medium">Active Opportunities</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedCustomer.activeDeals} deal{selectedCustomer.activeDeals > 1 ? "s" : ""} in progress
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">New prospect</p>
                          <p className="text-xs text-muted-foreground">No previous deals</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                  Close
                </Button>
                <Link to={`/sales/deals?customer=${selectedCustomer.id}`}>
                  <Button>
                    View Deals
                  </Button>
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
