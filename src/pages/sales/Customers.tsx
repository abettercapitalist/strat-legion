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
  Briefcase,
  UserPlus
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface Customer {
  id: string;
  name: string;
  type: "new" | "existing";
  industry: string;
  totalArr: string;
  arrValue: number;
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
    arrValue: 85,
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
    arrValue: 62,
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
    arrValue: 45,
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
    arrValue: 38,
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
    arrValue: 57,
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

// Data for customer type distribution
const customerTypeData = [
  { name: "Prospects", value: 3, color: "hsl(var(--primary))" },
  { name: "Customers", value: 2, color: "hsl(var(--status-success))" },
];

// Data for ARR by customer
const arrByCustomer = customers
  .sort((a, b) => b.arrValue - a.arrValue)
  .map(c => ({
    name: c.name.split(' ')[0], // First word only for chart
    arr: c.arrValue,
    type: c.type,
  }));

const customerStats = {
  total: 5,
  newCustomers: 3,
  existingCustomers: 2,
  totalPipelineValue: "$287K",
};

// Custom tooltip for bar chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium">{payload[0].payload.name}</p>
        <p className="text-xs text-muted-foreground">
          ${payload[0].value}K ARR
        </p>
      </div>
    );
  }
  return null;
};

export default function Customers() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const totalArr = customers.reduce((acc, c) => acc + c.arrValue, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">My Customers</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Relationships and account history
        </p>
      </div>

      {/* Hero Visualization */}
      <div className="grid grid-cols-12 gap-6">
        {/* ARR Distribution Bar Chart - Main Visual */}
        <Card className="col-span-7 border-border overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                ARR by Customer
              </CardTitle>
              <span className="text-lg font-semibold">${totalArr}K <span className="text-sm font-normal text-muted-foreground">total</span></span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={arrByCustomer} layout="vertical" barSize={24}>
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="arr" radius={[0, 6, 6, 0]}>
                    {arrByCustomer.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.type === "new" 
                          ? "hsl(var(--primary))" 
                          : "hsl(var(--status-success))"
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm text-muted-foreground">Prospects</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-status-success" />
                <span className="text-sm text-muted-foreground">Existing Customers</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Type Donut + Stats */}
        <div className="col-span-5 space-y-4">
          <Card className="border-border">
            <CardContent className="pt-5">
              <div className="flex items-center gap-6">
                {/* Donut */}
                <div className="relative w-28 h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={customerTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={50}
                        paddingAngle={4}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {customerTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-semibold">{customerStats.total}</span>
                    <span className="text-[10px] text-muted-foreground">Total</span>
                  </div>
                </div>
                {/* Breakdown */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-primary" />
                      <span className="text-sm">Prospects</span>
                    </div>
                    <span className="font-semibold">{customerStats.newCustomers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-status-success" />
                      <span className="text-sm">Customers</span>
                    </div>
                    <span className="font-semibold">{customerStats.existingCustomers}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Renewals */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-status-warning" />
                <CardTitle className="text-sm font-medium">Upcoming Renewals</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {customers
                .filter(c => c.renewalDate)
                .map(customer => (
                  <div 
                    key={customer.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedCustomer(customer)}
                  >
                    <span className="text-sm font-medium">{customer.name}</span>
                    <Badge variant="outline" className="text-xs bg-status-warning/10 text-status-warning border-status-warning/20">
                      {customer.renewalDate}
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
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
                className="hover:bg-muted/20 transition-colors cursor-pointer group"
                onClick={() => setSelectedCustomer(customer)}
              >
                <td className="px-6 py-4">
                  <div>
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">{customer.name}</span>
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
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
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
                    <Badge 
                      variant="outline" 
                      className={`mb-2 ${
                        selectedCustomer.type === "new" 
                          ? "bg-primary/10 text-primary border-primary/20" 
                          : "bg-status-success/10 text-status-success border-status-success/20"
                      }`}
                    >
                      {selectedCustomer.type === "new" ? "Prospect" : "Customer"}
                    </Badge>
                    <DialogTitle className="text-xl">{selectedCustomer.name}</DialogTitle>
                    <p className="text-muted-foreground mt-1">
                      {selectedCustomer.industry}
                    </p>
                  </div>
                  {/* Contact Card */}
                  <div className="text-right text-sm bg-muted/30 rounded-lg p-3">
                    <p className="font-medium">{selectedCustomer.primaryContact.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedCustomer.primaryContact.title}</p>
                    <div className="flex items-center justify-end gap-2 mt-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>{selectedCustomer.primaryContact.email}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{selectedCustomer.primaryContact.phone}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              {/* Visual Summary */}
              <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Total ARR</p>
                    <p className="text-xl font-semibold mt-1">{selectedCustomer.totalArr}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Deals</p>
                    <p className="text-xl font-semibold mt-1">{selectedCustomer.activeDeals}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Closed Deals</p>
                    <p className="text-xl font-semibold mt-1">{selectedCustomer.closedDeals}</p>
                  </div>
                  {selectedCustomer.relationshipStart && (
                    <div>
                      <p className="text-sm text-muted-foreground">Customer Since</p>
                      <p className="text-xl font-semibold mt-1">{selectedCustomer.relationshipStart}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedCustomer.renewalDate && (
                <Card className="mt-4 border-status-warning/30 bg-status-warning/5">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-status-warning/10">
                          <Calendar className="h-4 w-4 text-status-warning" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Renewal Due</p>
                          <p className="text-lg font-semibold">{selectedCustomer.renewalDate}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Schedule Call
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="mt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Deal History</h4>
                {selectedCustomer.closedDeals > 0 ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Previous Contracts</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedCustomer.closedDeals} closed deal{selectedCustomer.closedDeals > 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-status-success/10 text-status-success border-status-success/20">
                        Completed
                      </Badge>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Active Opportunities</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedCustomer.activeDeals} deal{selectedCustomer.activeDeals > 1 ? "s" : ""} in progress
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        In Progress
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-muted/30 rounded-lg">
                    <UserPlus className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">New prospect</p>
                    <p className="text-xs text-muted-foreground">No previous deals on record</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                  Close
                </Button>
                <Link to={`/sales/deals?customer=${selectedCustomer.id}`}>
                  <Button>
                    View Deals
                    <ArrowRight className="ml-2 h-4 w-4" />
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
