import { Checkbox, Select } from "@/components/ui/field";
import type { AdminFacetGroup } from "@/lib/api/types";

/**
 * Значения фильтров под одним именем facetValueIds: Server Action читает
 * их через formData.getAll().
 *
 * У групп с singleSelect — выпадающий список вместо галочек: бэкенд
 * одиночность не проверяет, и двумя галочками каталог получал бы
 * взаимоисключающие фильтры. Список шлёт ровно одно значение под тем же
 * именем, пустое отбрасывается при разборе формы.
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
            {group.singleSelect ? (
              <span className="sm:col-span-2">
                <Select
                  name="facetValueIds"
                  aria-label={group.title}
                  defaultValue={group.values.find((value) => selected.includes(value.id))?.id ?? ""}
                >
                  <option value="">Не задано</option>
                  {group.values.map((value) => (
                    <option key={value.id} value={value.id}>
                      {value.label}
                    </option>
                  ))}
                </Select>
              </span>
            ) : (
              group.values.map((value) => (
                <Checkbox
                  key={value.id}
                  name="facetValueIds"
                  value={value.id}
                  defaultChecked={selected.includes(value.id)}
                  label={value.label}
                />
              ))
            )}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
