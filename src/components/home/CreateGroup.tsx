"use client";

import { useId, useState, type FormEvent } from "react";
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

export function CreateGroup({ onCreated, className }: CreateGroupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState<GroupFormValues>(EMPTY_GROUP_FORM);
  const addGroup = useTodosStore((state) => state.addGroup);

  const titleId = useId();
  const descriptionId = useId();

  const closeModal = () => {
    setIsOpen(false);
    setFormValues({ ...EMPTY_GROUP_FORM });
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
        <FormField label="Title" htmlFor={titleId}>
          <input
            id={titleId}
            autoFocus
            value={formValues.title}
            onChange={(event) =>
              setFormValues((current) => ({
                ...current,
                title: event.target.value,
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
    </>
  );
}
