
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RadarItem, RadarItemType, RadarCategory, RadarDistance, RadarImpact, RadarTolerance } from "@/lib/types";
import { radarAttributes } from "@/lib/data";

interface RadarItemDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (item: RadarItem) => void;
  item: RadarItem | null;
}

const defaultItem: Omit<RadarItem, 'id'> = {
  title: "",
  detection: "",
  assessment: "",
  decision: "",
  type: "Threat",
  category: "Business",
  distance: "Detected",
  impact: "Low",
  tolerance: "Medium",
  zoomInLink: "",
};

export function RadarItemDialog({ isOpen, onOpenChange, onSave, item }: RadarItemDialogProps) {
  const [formData, setFormData] = useState<Omit<RadarItem, 'id'>>(defaultItem);

  useEffect(() => {
    if (isOpen) {
      setFormData(item ? { ...item } : defaultItem);
    }
  }, [isOpen, item]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: keyof typeof formData, value: string) => {
    handleChange(field, value);
  };

  const handleSubmit = () => {
    if (!formData.title) return;
    const finalItem: RadarItem = {
      id: item?.id || `radar-${Date.now()}`,
      ...formData,
    };
    onSave(finalItem);
    onOpenChange(false);
  };
  
  const isFormValid = formData.title.trim() !== "";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Radar Item" : "Create New Radar Item"}</DialogTitle>
          <DialogDescription>
            Fill in the details for the radar item below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="A concise title for the item" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="detection">What have you detected?</Label>
            <Textarea id="detection" value={formData.detection} onChange={(e) => handleChange('detection', e.target.value)} placeholder="Describe the signal or event." rows={3}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="assessment">What is your assessment?</Label>
            <Textarea id="assessment" value={formData.assessment} onChange={(e) => handleChange('assessment', e.target.value)} placeholder="Analyze the potential impact and implications." rows={3}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="decision">What decisions could you take?</Label>
            <Textarea id="decision" value={formData.decision} onChange={(e) => handleChange('decision', e.target.value)} placeholder="Outline potential actions or strategies." rows={3}/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => handleSelectChange('type', v as RadarItemType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{radarAttributes.types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => handleSelectChange('category', v as RadarCategory)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{radarAttributes.categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label>Distance</Label>
              <Select value={formData.distance} onValueChange={(v) => handleSelectChange('distance', v as RadarDistance)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{radarAttributes.distances.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label>Impact</Label>
              <Select value={formData.impact} onValueChange={(v) => handleSelectChange('impact', v as RadarImpact)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{radarAttributes.impacts.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label>Tolerance</Label>
              <Select value={formData.tolerance} onValueChange={(v) => handleSelectChange('tolerance', v as RadarTolerance)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{radarAttributes.tolerances.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zoomInLink">Zoom In Link (Optional)</Label>
            <Input id="zoomInLink" value={formData.zoomInLink} onChange={(e) => handleChange('zoomInLink', e.target.value)} placeholder="https://..." />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={!isFormValid}>
            Save Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
