import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import organizationService from '@/api/organizationService';
import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const OrgSelector = () => {
  const { user, selectedOrgId, selectOrg } = useAuth();
  const [orgs, setOrgs] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user?.role !== 'superadmin') return;
    organizationService.getOrganizations().then((res) => setOrgs(res.data || []));
  }, [user]);

  if (user?.role !== 'superadmin') return null;

  const currentOrg = orgs.find((o) => o._id === selectedOrgId);

  const handleSelect = (orgId) => {
    // Clicking the already-selected org again clears back to "All Organizations"
    selectOrg(orgId === selectedOrgId ? null : orgId);
    setOpen(false);
  };

  return (
    <div className="px-3 py-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-sm font-normal"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{currentOrg ? currentOrg.name : 'All Organizations'}</span>
            </span>
            <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search organizations..." />
            <CommandList>
              <CommandEmpty>No organization found.</CommandEmpty>
              <CommandGroup>
                <CommandItem value="__all__" onSelect={() => handleSelect(null)}>
                  <Check className={cn('mr-2 w-4 h-4', !selectedOrgId ? 'opacity-100' : 'opacity-0')} />
                  All Organizations
                </CommandItem>
                {orgs.map((org) => (
                  <CommandItem key={org._id} value={org.name} onSelect={() => handleSelect(org._id)}>
                    <Check className={cn('mr-2 w-4 h-4', selectedOrgId === org._id ? 'opacity-100' : 'opacity-0')} />
                    {org.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default OrgSelector;