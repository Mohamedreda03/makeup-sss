"use client";

import { Textarea } from "@/components/ui/textarea";

interface NotesFieldProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function NotesField({ notes, onNotesChange }: NotesFieldProps) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg mb-6">
      <label htmlFor="notes" className="block text-sm font-medium mb-2">
        Special Requests or Notes
      </label>
      <Textarea
        id="notes"
        placeholder="Any special requests or additional information"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        rows={3}
        className="bg-white"
      />
    </div>
  );
}
