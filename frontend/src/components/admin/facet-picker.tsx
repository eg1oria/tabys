import { Checkbox } from "@/components/ui/field";
import type { AdminFacetGroup } from "@/lib/api/types";

/**
 * Значения фильтров — обычные чекбоксы под одним именем facetValueIds.
 * Server Action читает их через formData.getAll().
 */
export function FacetPicker({
  groups,
  selected,
}: {
  groups: AdminFacetGroup[];
  selected: string[];
}) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <fieldset key={group.id}>
          <legend className="section-label mb-2">{group.title}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.values.map((value) => (
              <Checkbox
                key={value.id}
                name="facetValueIds"
                value={value.id}
                defaultChecked={selected.includes(value.id)}
                label={value.label}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
