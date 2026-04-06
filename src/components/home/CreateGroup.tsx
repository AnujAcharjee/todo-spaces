"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import type { GroupFormValues } from "@/@types";
import { FloatingButton } from "@/components/ui/FloatingButton";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useTodosStore } from "@/store/todo.store";

interface CreateGroupProps {
  onCreated?: (groupId: string) => void;
  className?: string;
}

const EMPTY_GROUP_FORM: GroupFormValues = {
  title: "",
  description: "",
};

const GROUP_TITLE_SINGLE_LINE_WIDTH = 136;
const FALLBACK_GROUP_TITLE_MAX_LENGTH = 22;

export function CreateGroup({ onCreated, className }: CreateGroupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState<GroupFormValues>(EMPTY_GROUP_FORM);
  const addGroup = useTodosStore((state) => state.addGroup);

  const titleId = useId();
  const descriptionId = useId();
  const groupTitleMeasureRef = useRef<HTMLSpanElement>(null);

  const closeModal = () => {
    setIsOpen(false);
    setFormValues({ ...EMPTY_GROUP_FORM });
  };

  const getFittingGroupTitle = (value: string) => {
    const normalizedValue = value.replace(/\r?\n/g, " ");
    const measureNode = groupTitleMeasureRef.current;

    if (!measureNode) {
      return normalizedValue.slice(0, FALLBACK_GROUP_TITLE_MAX_LENGTH);
    }

    let fittedValue = "";

    for (const character of normalizedValue) {
      const candidate = fittedValue + character;
      measureNode.textContent = candidate || " ";

      if (measureNode.scrollWidth > GROUP_TITLE_SINGLE_LINE_WIDTH) {
        break;
      }

      fittedValue = candidate;
    }

    return fittedValue;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const groupId = addGroup(formValues);

      if (!groupId) {
        return;
      }

      closeModal();
      onCreated?.(groupId);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <FloatingButton
        type="button"
        onClick={() => setIsOpen(true)}
        className={className}
      >
        <i className="bi bi-plus-circle text-base" />
        <span>Create Group</span>
      </FloatingButton>

      <Modal
        open={isOpen}
        title="Create a new group"
        description="Give it a name and a vibe... we'll keep everything saved locally 🫡"
        submitLabel="Create Group"
        loading={isSaving}
        onClose={closeModal}
        onSubmit={handleSubmit}
      >
        <FormField
          label="Title"
          htmlFor={titleId}
          hint="Title stops when it would overflow one line in the group pill."
        >
          <input
            id={titleId}
            autoFocus
            value={formValues.title}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                title: getFittingGroupTitle(event.target.value),
              }))
            }
            placeholder="Daily errands"
            className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.08]"
          />
        </FormField>

        <FormField
          label="Description"
          htmlFor={descriptionId}
        >
          <textarea
            id={descriptionId}
            rows={4}
            value={formValues.description}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Tasks for home chores and quick reminders"
            className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.08]"
          />
        </FormField>
      </Modal>

      <span
        ref={groupTitleMeasureRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-[-9999px] top-0 whitespace-nowrap text-sm font-semibold opacity-0"
      />
    </>
  );
}
