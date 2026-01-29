import { useState } from "react";
import Dropdown from "./Dropdown";
import Button from "../Button/Button";
import UserAvatar from "../UserAvatar/UserAvatar";
import { UserRole } from "@scrmpkr/shared";

export default {
  title: "DS/Dropdown",
  component: Dropdown,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A dropdown menu component with multiple placement options and smooth animations.",
      },
    },
  },
};

/**
 * Basic dropdown with simple menu items.
 */
export const Basic = {
  render: () => (
    <div className="p-20">
      <Dropdown
        trigger={({ onClick, className }) => (
          <Button variant="primary" onClick={onClick} className={className}>
            Open Menu
          </Button>
        )}
      >
        <div className="w-48 p-4">
          <div className="space-y-2">
            <button
              type="button"
              className="block w-full rounded-md px-3 py-2 text-left text-gray-300 text-sm hover:bg-gray-700 hover:text-white"
            >
              Menu Item 1
            </button>
            <button
              type="button"
              className="block w-full rounded-md px-3 py-2 text-left text-gray-300 text-sm hover:bg-gray-700 hover:text-white"
            >
              Menu Item 2
            </button>
            <button
              type="button"
              className="block w-full rounded-md px-3 py-2 text-left text-gray-300 text-sm hover:bg-gray-700 hover:text-white"
            >
              Menu Item 3
            </button>
          </div>
        </div>
      </Dropdown>
    </div>
  ),
};

/**
 * Dropdown positioned below the trigger with left edges aligned.
 * Useful when you want the dropdown to "start" from the trigger.
 */
export const BottomStart = {
  render: () => (
    <div className="p-20">
      <Dropdown
        trigger={({ onClick, className }) => (
          <Button variant="primary" onClick={onClick} className={className}>
            Bottom Start
          </Button>
        )}
        placement="bottom-start"
      >
        <div className="w-48 p-4">
          <p className="text-sm text-white">Positioned below trigger</p>
          <p className="text-gray-400 text-xs">Left edges aligned</p>
        </div>
      </Dropdown>
    </div>
  ),
};

/**
 * Dropdown positioned below the trigger with right edges aligned.
 * Common for user account menus and action menus.
 */
export const BottomEnd = {
  render: () => (
    <div className="p-20">
      <Dropdown
        trigger={({ onClick, className }) => (
          <Button variant="primary" onClick={onClick} className={className}>
            Bottom End
          </Button>
        )}
        placement="bottom-end"
      >
        <div className="w-48 p-4">
          <p className="text-sm text-white">Positioned below trigger</p>
          <p className="text-gray-400 text-xs">Right edges aligned</p>
        </div>
      </Dropdown>
    </div>
  ),
};

/**
 * Dropdown positioned below the trigger and centered.
 * Good for tooltips and contextual information.
 */
export const BottomCenter = {
  render: () => (
    <div className="p-20">
      <Dropdown
        trigger={({ onClick, className }) => (
          <Button variant="primary" onClick={onClick} className={className}>
            Bottom Center
          </Button>
        )}
        placement="bottom-center"
      >
        <div className="w-48 p-4">
          <p className="text-sm text-white">Positioned below trigger</p>
          <p className="text-gray-400 text-xs">Centered horizontally</p>
        </div>
      </Dropdown>
    </div>
  ),
};

/**
 * Dropdown positioned above the trigger with left edges aligned.
 * Useful when there's limited space below the trigger.
 */
export const TopStart = {
  render: () => (
    <div className="p-20 pt-40">
      <Dropdown
        trigger={({ onClick, className }) => (
          <Button variant="primary" onClick={onClick} className={className}>
            Top Start
          </Button>
        )}
        placement="top-start"
      >
        <div className="w-48 p-4">
          <p className="text-sm text-white">Positioned above trigger</p>
          <p className="text-gray-400 text-xs">Left edges aligned</p>
        </div>
      </Dropdown>
    </div>
  ),
};

/**
 * Dropdown positioned above the trigger with right edges aligned.
 * Useful for menus that need to align with the right side of the trigger.
 */
export const TopEnd = {
  render: () => (
    <div className="p-20 pt-40">
      <Dropdown
        trigger={({ onClick, className }) => (
          <Button variant="primary" onClick={onClick} className={className}>
            Top End
          </Button>
        )}
        placement="top-end"
      >
        <div className="w-48 p-4">
          <p className="text-sm text-white">Positioned above trigger</p>
          <p className="text-gray-400 text-xs">Right edges aligned</p>
        </div>
      </Dropdown>
    </div>
  ),
};

/**
 * Dropdown positioned above the trigger and centered.
 * Good for tooltips that appear above elements.
 */
export const TopCenter = {
  render: () => (
    <div className="p-20 pt-40">
      <Dropdown
        trigger={({ onClick, className }) => (
          <Button variant="primary" onClick={onClick} className={className}>
            Top Center
          </Button>
        )}
        placement="top-center"
      >
        <div className="w-48 p-4">
          <p className="text-sm text-white">Positioned above trigger</p>
          <p className="text-gray-400 text-xs">Centered horizontally</p>
        </div>
      </Dropdown>
    </div>
  ),
};

/**
 * Controlled dropdown where the open state is managed externally.
 * Useful when you need to control the dropdown programmatically.
 */
export const Controlled = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="p-20">
        <div className="mb-4 flex items-center gap-4">
          <Button variant="secondary" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? "Close" : "Open"} Menu
          </Button>
          <span className="text-sm text-white">
            Menu is {isOpen ? "open" : "closed"}
          </span>
        </div>
        <Dropdown
          trigger={({ onClick, className }) => (
            <Button variant="primary" onClick={onClick} className={className}>
              Controlled Menu
            </Button>
          )}
          open={isOpen}
          onOpenChange={setIsOpen}
        >
          <div className="w-48 p-4">
            <div className="space-y-2">
              <button
                type="button"
                className="block w-full rounded-md px-3 py-2 text-left text-gray-300 text-sm hover:bg-gray-700 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                Close Menu
              </button>
              <button
                type="button"
                className="block w-full rounded-md px-3 py-2 text-left text-gray-300 text-sm hover:bg-gray-700 hover:text-white"
              >
                Keep Menu Open
              </button>
            </div>
          </div>
        </Dropdown>
      </div>
    );
  },
};

/**
 * Real-world example using a UserAvatar as the trigger.
 * Demonstrates how to create user account menus.
 */
export const WithUserAvatar = {
  render: () => (
    <div className="p-20">
      <Dropdown
        trigger={({ onClick, className }) => (
          <button
            type="button"
            onClick={onClick}
            className={`focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${
              className || ""
            }`}
          >
            <UserAvatar
              name="John Doe"
              role={UserRole.PARTICIPANT}
              interactive={true}
              showTooltip={true}
            />
          </button>
        )}
        placement="bottom-end"
      >
        <div className="w-64 p-4">
          <div className="mb-4 flex items-center space-x-3">
            <UserAvatar name="John Doe" role={UserRole.PARTICIPANT} size="lg" />
            <div>
              <p className="font-medium text-white">John Doe</p>
            </div>
          </div>

          <hr className="mb-4 border-gray-700" />

          <button
            type="button"
            className="w-full rounded-md px-3 py-2 text-left text-gray-300 text-sm hover:bg-gray-700 hover:text-white"
          >
            Change username
          </button>
        </div>
      </Dropdown>
    </div>
  ),
};
