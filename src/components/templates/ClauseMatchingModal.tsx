import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle, AlertCircle, Plus, Link2 } from 'lucide-react';
import { ClauseMatch, ClauseBlock } from '@/lib/clauseMatching';
import { cn } from '@/lib/utils';

interface ClauseMatchingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  block: ClauseBlock | null;
  onConfirmMatch: (blockIndex: number, clauseId: string) => void;
  onAddAsAlternative: (blockIndex: number, clauseId: string, alternativeText: string) => void;
  onAddAsNew: (blockIndex: number, clause: { title: string; category: string; text: string }) => void;
  onSkip: (blockIndex: number) => void;
  categories: string[];
}

type Action = 'use_existing' | 'add_alternative' | 'add_new' | 'skip';

export function ClauseMatchingModal({
  open,
  onOpenChange,
  block,
  onConfirmMatch,
  onAddAsAlternative,
  onAddAsNew,
  onSkip,
  categories,
}: ClauseMatchingModalProps) {
  const [action, setAction] = useState<Action>('use_existing');
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [newClauseTitle, setNewClauseTitle] = useState('');
  const [newClauseCategory, setNewClauseCategory] = useState('');

  // Reset state when block changes
  const handleOpenChange = (open: boolean) => {
    if (open && block) {
      // Set defaults based on matches
      if (block.matches && block.matches.length > 0) {
        const topMatch = block.matches[0];
        setSelectedMatchId(topMatch.clauseId);
        if (topMatch.matchType === 'exact') {
          setAction('use_existing');
        } else if (topMatch.similarity >= 75) {
          setAction('add_alternative');
        } else {
          setAction('add_new');
        }
      } else {
        setAction('add_new');
        setSelectedMatchId('');
      }
      setNewClauseTitle(block.title);
      setNewClauseCategory('');
    }
    onOpenChange(open);
  };

  const handleConfirm = () => {
    if (!block) return;

    switch (action) {
      case 'use_existing':
        if (selectedMatchId) {
          onConfirmMatch(block.index, selectedMatchId);
        }
        break;
      case 'add_alternative':
        if (selectedMatchId) {
          onAddAsAlternative(block.index, selectedMatchId, block.text);
        }
        break;
      case 'add_new':
        onAddAsNew(block.index, {
          title: newClauseTitle || block.title,
          category: newClauseCategory || 'General',
          text: block.text,
        });
        break;
      case 'skip':
        onSkip(block.index);
        break;
    }

    onOpenChange(false);
  };

  if (!block) return null;

  const topMatch = block.matches?.[0];
  const hasGoodMatch = topMatch && topMatch.similarity >= 75;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasGoodMatch ? (
              <>
                <CheckCircle className="h-5 w-5 text-primary" />
                Potential Clause Match Found
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500" />
                New Clause Detected
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Review this clause from your template and decide how to handle it.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Document Clause */}
            <div className="p-3 rounded-lg border bg-muted/30">
              <p className="text-sm font-medium mb-1">{block.title}</p>
              <p className="text-sm text-muted-foreground line-clamp-4">{block.text}</p>
            </div>

            <Separator />

            {/* Action Selection */}
            <RadioGroup value={action} onValueChange={(v) => setAction(v as Action)}>
              {/* Use Existing Match */}
              {block.matches && block.matches.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="use_existing" id="use_existing" />
                    <Label htmlFor="use_existing" className="font-medium">
                      Use existing clause from library
                    </Label>
                  </div>

                  {action === 'use_existing' && (
                    <div className="ml-6 space-y-2">
                      {block.matches.slice(0, 3).map((match) => (
                        <button
                          key={match.clauseId}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-colors",
                            selectedMatchId === match.clauseId
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => setSelectedMatchId(match.clauseId)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{match.clauseTitle}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{match.clauseCategory}</Badge>
                              <Badge
                                variant={match.similarity >= 90 ? 'default' : 'secondary'}
                              >
                                {match.similarity}% match
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {match.clauseText}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  <Separator className="my-2" />

                  {/* Add as Alternative */}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="add_alternative" id="add_alternative" />
                    <Label htmlFor="add_alternative" className="font-medium flex items-center gap-2">
                      <Link2 className="h-4 w-4" />
                      Add as alternative to existing clause
                    </Label>
                  </div>

                  {action === 'add_alternative' && (
                    <div className="ml-6 space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Link this text as an alternative version of:
                      </p>
                      {block.matches.slice(0, 3).map((match) => (
                        <button
                          key={match.clauseId}
                          className={cn(
                            "w-full text-left p-3 rounded-lg border transition-colors",
                            selectedMatchId === match.clauseId
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          )}
                          onClick={() => setSelectedMatchId(match.clauseId)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{match.clauseTitle}</span>
                            <Badge variant="outline">{match.clauseCategory}</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <Separator className="my-2" />
                </div>
              )}

              {/* Add as New */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add_new" id="add_new" />
                <Label htmlFor="add_new" className="font-medium flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add as new clause to library
                </Label>
              </div>

              {action === 'add_new' && (
                <div className="ml-6 space-y-3">
                  <div>
                    <Label htmlFor="new_title" className="text-sm">
                      Clause Title
                    </Label>
                    <Input
                      id="new_title"
                      value={newClauseTitle}
                      onChange={(e) => setNewClauseTitle(e.target.value)}
                      placeholder="Enter clause title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new_category" className="text-sm">
                      Category
                    </Label>
                    <Select value={newClauseCategory} onValueChange={setNewClauseCategory}>
                      <SelectTrigger id="new_category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Clause Text</Label>
                    <Textarea
                      value={block.text}
                      readOnly
                      className="h-24 text-sm bg-muted/30"
                    />
                  </div>
                </div>
              )}

              <Separator className="my-2" />

              {/* Skip */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="skip" id="skip" />
                <Label htmlFor="skip" className="text-muted-foreground">
                  Skip - don't link to clause library
                </Label>
              </div>
            </RadioGroup>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            {action === 'use_existing' && 'Use This Clause'}
            {action === 'add_alternative' && 'Add as Alternative'}
            {action === 'add_new' && 'Create New Clause'}
            {action === 'skip' && 'Skip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
