'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, WandSparkles } from 'lucide-react';
import { type Transaction } from '@/lib/types';
import { queryTransactions } from '@/ai/flows/query-transactions';
import { useToast } from '@/hooks/use-toast';
import { RecentTransactions } from './recent-transactions';

interface SmartSearchProps {
  allTransactions: Transaction[];
}

export function SmartSearch({ allTransactions }: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Transaction[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const result = await queryTransactions({
        query,
        transactions: allTransactions,
      });

      const matchingTransactions = allTransactions.filter(t =>
        result.matchingTransactionIds.includes(t.id)
      );

      setSearchResults(matchingTransactions);
    } catch (error) {
      console.error('AI search failed:', error);
      toast({
        title: 'Search Failed',
        description: 'The AI search could not be completed at this time.',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  const highlightedIds = useMemo(() => {
    return new Set(searchResults.map(t => t.id));
  }, [searchResults]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WandSparkles className="h-5 w-5 text-primary" />
            <span>Smart Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              placeholder="e.g., show my expenses on food last week..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              disabled={isSearching}
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="mr-2 h-4 w-4" />
              )}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {hasSearched && (
        <div className="mt-4">
            {isSearching ? (
                 <Card>
                    <CardHeader><CardTitle>Searching...</CardTitle></CardHeader>
                    <CardContent className="flex justify-center items-center py-12">
                       <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </CardContent>
                 </Card>
            ) : searchResults.length > 0 ? (
                <RecentTransactions transactions={searchResults} title="Search Results" highlightedIds={highlightedIds}/>
            ) : (
                <Card>
                    <CardHeader><CardTitle>No Results</CardTitle></CardHeader>
                    <CardContent className="text-center py-12">
                        <p className="text-muted-foreground">No transactions matched your search.</p>
                    </CardContent>
                 </Card>
            )}
        </div>
      )}
    </div>
  );
}
