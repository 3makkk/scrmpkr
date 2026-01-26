import { useState } from "react";
import { expect, userEvent, within } from "storybook/test";
import Modal from "./Modal";
import Button from "../Button/Button";
import Card from "../Card/Card";

export default {
  title: "DS/Modal",
  component: Modal,
};

export const Basic = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-6">
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Modal
        </Button>

        <Modal open={isOpen} onClose={() => setIsOpen(false)}>
          <Card className="w-md">
            <h2 className="text-2xl font-medium text-white mb-4">
              Basic Modal
            </h2>
            <p className="text-gray-400 mb-6">
              This is a basic modal with content.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Confirm
              </Button>
            </div>
          </Card>
        </Modal>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Modal should not be visible initially
    expect(canvas.queryByText("Basic Modal")).not.toBeInTheDocument();

    // Click the "Open Modal" button
    const openButton = canvas.getByRole("button", { name: /open modal/i });
    await userEvent.click(openButton);

    // Modal should now be visible
    await expect(canvas.getByText("Basic Modal")).toBeInTheDocument();
    await expect(
      canvas.getByText("This is a basic modal with content."),
    ).toBeInTheDocument();
  },
};

export const WithForm = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");

    return (
      <div className="p-6">
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Edit Profile
        </Button>

        <Modal open={isOpen} onClose={() => setIsOpen(false)}>
          <Card className="w-md">
            <h2 className="text-2xl font-medium text-white mb-2">
              Edit Profile
            </h2>
            <p className="text-gray-400 mb-6">
              Update your profile information
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-2 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Save Changes
              </Button>
            </div>
          </Card>
        </Modal>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click the "Open Modal" button
    const openButton = canvas.getByRole("button", { name: /edit profile/i });
    await userEvent.click(openButton);

    // Modal should now be visible
    await expect(
      canvas.getByText("Update your profile information"),
    ).toBeInTheDocument();
  },
};

export const NoBackdropClose = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-6">
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Modal (No Backdrop Close)
        </Button>

        <Modal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          closeOnBackdrop={false}
        >
          <Card className="w-md">
            <h2 className="text-2xl font-medium text-white mb-4">
              Important Notice
            </h2>
            <p className="text-gray-400 mb-6">
              This modal cannot be closed by clicking outside. You must use the
              buttons below.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Acknowledge
              </Button>
            </div>
          </Card>
        </Modal>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click the "Open Modal (No Backdrop Close)" button
    const openButton = canvas.getByRole("button", {
      name: /open modal \(no backdrop close\)/i,
    });
    await userEvent.click(openButton);

    // Modal should now be visible
    await expect(canvas.getByText("Important Notice")).toBeInTheDocument();

    // Click outside the modal content
    await userEvent.click(document.body);

    // Modal should still be visible
    await expect(canvas.getByText("Important Notice")).toBeInTheDocument();
  },
};

export const NoEscapeClose = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-6">
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Modal (No Escape Key)
        </Button>

        <Modal
          open={isOpen}
          onClose={() => setIsOpen(false)}
          closeOnEscape={false}
        >
          <Card className="w-md">
            <h2 className="text-2xl font-medium text-white mb-4">
              Critical Action
            </h2>
            <p className="text-gray-400 mb-6">
              This modal cannot be closed with the Escape key. You must
              explicitly confirm or cancel.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => setIsOpen(false)}>
                Delete
              </Button>
            </div>
          </Card>
        </Modal>
      </div>
    );
  },
};

export const LargeContent = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-6">
        <Button variant="primary" onClick={() => setIsOpen(true)}>
          Open Large Modal
        </Button>

        <Modal open={isOpen} onClose={() => setIsOpen(false)}>
          <Card className="w-xl max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-medium text-white mb-4">
              Terms of Service
            </h2>
            <div className="text-gray-400 space-y-4 mb-6">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <p>
                Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur.
              </p>
              <p>
                Excepteur sint occaecat cupidatat non proident, sunt in culpa
                qui officia deserunt mollit anim id est laborum.
              </p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <p>
                Ut enim ad minim veniam, quis nostrud exercitation ullamco
                laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur.
              </p>
              <p>
                Excepteur sint occaecat cupidatat non proident, sunt in culpa
                qui officia deserunt mollit anim id est laborum.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Decline
              </Button>
              <Button variant="primary" onClick={() => setIsOpen(false)}>
                Accept
              </Button>
            </div>
          </Card>
        </Modal>
      </div>
    );
  },
};

export const MultipleModals = {
  render: () => {
    const [firstModal, setFirstModal] = useState(false);
    const [secondModal, setSecondModal] = useState(false);

    return (
      <div className="p-6">
        <Button variant="primary" onClick={() => setFirstModal(true)}>
          Open First Modal
        </Button>

        <Modal open={firstModal} onClose={() => setFirstModal(false)}>
          <Card className="w-md">
            <h2 className="text-2xl font-medium text-white mb-4">
              First Modal
            </h2>
            <p className="text-gray-400 mb-6">
              This modal can open another modal on top of it.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setFirstModal(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => setSecondModal(true)}>
                Open Second Modal
              </Button>
            </div>
          </Card>
        </Modal>

        <Modal open={secondModal} onClose={() => setSecondModal(false)}>
          <Card className="w-md">
            <h2 className="text-2xl font-medium text-white mb-4">
              Second Modal
            </h2>
            <p className="text-gray-400 mb-6">
              This is a modal on top of another modal.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSecondModal(false)}>
                Close This Modal
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setSecondModal(false);
                  setFirstModal(false);
                }}
              >
                Close All
              </Button>
            </div>
          </Card>
        </Modal>
      </div>
    );
  },
};

export const ConfirmationModal = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-6">
        <Button variant="danger" onClick={() => setIsOpen(true)}>
          Delete Item
        </Button>

        <Modal open={isOpen} onClose={() => setIsOpen(false)}>
          <Card className="w-md">
            <h2 className="text-2xl font-medium text-white mb-4">
              Confirm Deletion
            </h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this item? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => setIsOpen(false)}>
                Delete
              </Button>
            </div>
          </Card>
        </Modal>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click the "Delete Item" button
    const deleteButton = canvas.getByRole("button", { name: /delete item/i });
    await userEvent.click(deleteButton);

    // Modal should now be visible
    await expect(canvas.getByText("Confirm Deletion")).toBeInTheDocument();

    // Click Cancel button
    const cancelButton = within(canvas.getByRole("dialog")).getByRole(
      "button",
      { name: /cancel/i },
    );
    await userEvent.click(cancelButton);

    // Modal should be closed
    expect(canvas.queryByText("Confirm Deletion")).not.toBeInTheDocument();

    // Reopen modal
    await userEvent.click(deleteButton);

    // Click Delete button
    const confirmDeleteButton = within(canvas.getByRole("dialog")).getByRole(
      "button",
      { name: /delete/i },
    );
    await userEvent.click(confirmDeleteButton);

    // Modal should be closed
    expect(canvas.queryByText("Confirm Deletion")).not.toBeInTheDocument();
  },
};
