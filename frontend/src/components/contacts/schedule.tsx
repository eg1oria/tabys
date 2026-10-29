import { Clock } from "@/components/ui/icons";
import { schedule } from "@/lib/content/company";
import { cn } from "@/lib/utils";

export function Schedule() {
  return (
    <div>
      <ul>
        {schedule.map((day) => (
          <li
            key={day.day}
            className="flex items-center justify-between border-b border-line py-3.5 text-[14px] last:border-b-0"
          >
            <span>{day.day}</span>
            <span className={cn("tabular-nums", "off" in day && day.off ? "text-text-2" : "")}>
              {day.hours}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-7 flex gap-3.5 rounded-card bg-accent/8 p-5">
        <Clock className="mt-0.5 size-5 shrink-0 text-accent" />
        <p className="text-[13px] leading-relaxed text-text-2">
          Вы можете связаться с нами в любое удобное время — мы ответим в рабочее время.
        </p>
      </div>
    </div>
  );
}
