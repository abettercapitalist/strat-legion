import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ContractEditor } from "@/components/editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateTemplate() {
  const navigate = useNavigate();
  const [templateName, setTemplateName] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/law/templates")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Create New Template</h1>
            <p className="text-sm text-muted-foreground">
              Design your contract template with the editor below
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/law/templates")}>
            Cancel
          </Button>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 pt-6 min-h-0">
        {/* Editor Section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Template Meta */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="templateName" className="sr-only">
                Template Name
              </Label>
              <Input
                id="templateName"
                placeholder="Template Name (e.g., Enterprise SaaS Agreement)"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="text-lg font-medium"
              />
            </div>
            <div className="w-48">
              <Label htmlFor="category" className="sr-only">
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="procurement">Procurement</SelectItem>
                  <SelectItem value="employment">Employment</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* WYSIWYG Editor */}
          <div className="flex-1 min-h-0">
            <ContractEditor content={content} onChange={setContent} />
          </div>
        </div>

        {/* Clause Library Sidebar (placeholder) */}
        <div className="w-80 flex-shrink-0">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Clause Library</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Available clauses will appear here. Drag and drop to add to your template.
              </p>
              {/* Clause library content will be built next */}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
