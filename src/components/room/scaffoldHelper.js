// This file builds the complete, runnable code by combining
// a problem's specific function with a generic "harness"
// based on its input/output signature.

// --- HARNESS TEMPLATES ---
const HARNESS_TEMPLATES = {

    // --- Signature 1: [2,7,11,15]\n9 -> [0,1] ---
    ARRAY_INT_TARGET_INT: {
        python: (userCodeStub, funcName) => `
import json
# User's function definition
${userCodeStub}
    # --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
    pass

# --- TEST HARNESS ---
if __name__ == "__main__":
    array_line = input()
    target_line = input()
    target = int(target_line.strip())
    nums = json.loads(array_line)
    result = ${funcName}(nums, target)
    if result and len(result) == 2:
        print(f"[{result[0]}, {result[1]}]")
`,
        java: (userCodeStub, funcName) => `
import java.util.*;
import java.io.*;
import java.util.stream.Collectors;

public class Main {
    // User's function definition
    ${userCodeStub}
        // --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
        throw new UnsupportedOperationException("Not implemented yet");
    }

    // --- TEST HARNESS ---
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String arrayLine = sc.nextLine();
        String targetLine = sc.nextLine();
        
        int target = Integer.parseInt(targetLine.trim());
        arrayLine = arrayLine.substring(1, arrayLine.length() - 1);
        int[] nums = Arrays.stream(arrayLine.split(","))
                           .map(String::trim)
                           .mapToInt(Integer::parseInt)
                           .toArray();
        
        Main solution = new Main();
        int[] result = solution.${funcName}(nums, target);
        
        if (result != null && result.length == 2) {
            System.out.println("[" + result[0] + ", " + result[1] + "]");
        }
        sc.close();
    }
}
`,
    },

    // --- Signature 2: "racecar" -> true ---
    STRING_RETURN_BOOLEAN: {
        python: (userCodeStub, funcName) => `
# User's function definition
${userCodeStub}
    # --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
    pass

# --- TEST HARNESS ---
if __name__ == "__main__":
    s = input()
    result = ${funcName}(s)
    print(str(result).lower()) # Prints "true" or "false"
`,
        java: (userCodeStub, funcName) => `
import java.util.*;
import java.io.*;

public class Main {
    // User's function definition
    ${userCodeStub}
        // --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
        throw new UnsupportedOperationException("Not implemented yet");
    }

    // --- TEST HARNESS ---
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String s = sc.nextLine();
        Main solution = new Main();
        boolean result = solution.${funcName}(s);
        System.out.println(result);
        sc.close();
    }
}
`,
    },

    // --- Signature 3: [-2,1,-3,4] -> 6 ---
    ARRAY_INT_RETURN_INT: {
        python: (userCodeStub, funcName) => `
import json
# User's function definition
${userCodeStub}
    # --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
    pass

# --- TEST HARNESS ---
if __name__ == "__main__":
    array_line = input()
    nums = json.loads(array_line)
    result = ${funcName}(nums)
    print(result)
`,
        java: (userCodeStub, funcName) => `
import java.util.*;
import java.io.*;

public class Main {
    // User's function definition
    ${userCodeStub}
        // --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
        throw new UnsupportedOperationException("Not implemented yet");
    }

    // --- TEST HARNESS ---
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String arrayLine = sc.nextLine();
        arrayLine = arrayLine.substring(1, arrayLine.length() - 1);
        int[] nums = Arrays.stream(arrayLine.split(","))
                           .map(String::trim)
                           .mapToInt(Integer::parseInt)
                           .toArray();
        
        Main solution = new Main();
        int result = solution.${funcName}(nums);
        System.out.println(result);
        sc.close();
    }
}
`,
    },

    // --- Signature 4: [1,2,3] -> [3,2,1] ---
    LINKED_LIST_RETURN_LINKED_LIST: {
        python: (userCodeStub, funcName) => `
# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# User's function definition
${userCodeStub}
    # --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
    pass

# --- HELPER FUNCTIONS ---
def stringToLinkedList(input):
    if not input or input == "[]": return None
    parts = input[1:-1].split(',')
    head = ListNode(int(parts[0]))
    current = head
    for part in parts[1:]:
        current.next = ListNode(int(part.strip()))
        current = current.next
    return head

def linkedListToString(head):
    if not head: return "[]"
    parts = []
    current = head
    while current:
        parts.append(str(current.val))
        current = current.next
    return "[" + ",".join(parts) + "]"

# --- TEST HARNESS ---
if __name__ == "__main__":
    line = input()
    head = stringToLinkedList(line)
    result_head = ${funcName}(head)
    print(linkedListToString(result_head))
`,
        java: (userCodeStub, funcName) => `
import java.util.*;
import java.io.*;

// Definition for singly-linked list.
class ListNode {
    int val;
    ListNode next;
    ListNode(int x) { val = x; }
}

public class Main {
    // User's function definition
    ${userCodeStub}
        // --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
        throw new UnsupportedOperationException("Not implemented yet");
    }

    // --- HELPER FUNCTIONS ---
    public static ListNode stringToLinkedList(String input) {
        if (input == null || input.equals("[]")) return null;
        input = input.substring(1, input.length() - 1);
        String[] parts = input.split(",");
        if (parts.length == 0 || parts[0].isEmpty()) return null;
        
        ListNode head = new ListNode(Integer.parseInt(parts[0].trim()));
        ListNode current = head;
        for (int i = 1; i < parts.length; i++) {
            current.next = new ListNode(Integer.parseInt(parts[i].trim()));
            current = current.next;
        }
        return head;
    }

    public static String linkedListToString(ListNode head) {
        if (head == null) return "[]";
        StringBuilder sb = new StringBuilder();
        sb.append("[");
        ListNode current = head;
        while (current != null) {
            sb.append(current.val);
            if (current.next != null) sb.append(",");
            current = current.next;
        }
        sb.append("]");
        return sb.toString();
    }

    // --- TEST HARNESS ---
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.nextLine();
        ListNode head = stringToLinkedList(line);
        Main solution = new Main();
        ListNode resultHead = solution.${funcName}(head);
        System.out.println(linkedListToString(resultHead));
        sc.close();
    }
}
`,
    },

    // --- Signature 5: [1,2,3,4] pos=1 -> true ---
    LINKED_LIST_RETURN_BOOLEAN: {
        python: (userCodeStub, funcName) => `
# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# User's function definition
${userCodeStub}
    # --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
    pass

# --- HELPER FUNCTIONS ---
def stringToLinkedList(input, pos):
    if not input or input == "[]": return None
    parts = input[1:-1].split(',')
    head = ListNode(int(parts[0]))
    current = head
    cycleNode = None
    if pos == 0: cycleNode = head
    
    for i, part in enumerate(parts[1:], 1):
        current.next = ListNode(int(part.strip()))
        current = current.next
        if i == pos: cycleNode = current
            
    if cycleNode: current.next = cycleNode # Create cycle
    return head

# --- TEST HARNESS ---
if __name__ == "__main__":
    line = input()
    pos_line = input()
    pos = int(pos_line)
    head = stringToLinkedList(line, pos)
    result = ${funcName}(head)
    print(str(result).lower())
`,
        java: (userCodeStub, funcName) => `
import java.util.*;
import java.io.*;

class ListNode {
    int val;
    ListNode next;
    ListNode(int x) { val = x; }
}

public class Main {
    // User's function definition
    ${userCodeStub}
        // --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
        throw new UnsupportedOperationException("Not implemented yet");
    }

    // --- HELPER FUNCTIONS ---
    public static ListNode stringToLinkedList(String input, int pos) {
        if (input == null || input.equals("[]")) return null;
        input = input.substring(1, input.length() - 1);
        String[] parts = input.split(",");
        if (parts.length == 0 || parts[0].isEmpty()) return null;
        
        ListNode head = new ListNode(Integer.parseInt(parts[0].trim()));
        ListNode current = head;
        ListNode cycleNode = null;
        if (pos == 0) cycleNode = head;

        for (int i = 1; i < parts.length; i++) {
            current.next = new ListNode(Integer.parseInt(parts[i].trim()));
            current = current.next;
            if (i == pos) cycleNode = current;
        }
        if (cycleNode != null) current.next = cycleNode; // Create cycle
        return head;
    }

    // --- TEST HARNESS ---
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.nextLine();
        String posLine = sc.nextLine();
        int pos = Integer.parseInt(posLine);
        
        ListNode head = stringToLinkedList(line, pos);
        Main solution = new Main();
        boolean result = solution.${funcName}(head);
        System.out.println(result);
        sc.close();
    }
}
`,
    },

    // --- Signature 6: [3,9,20,null,null,15,7] -> 3 ---
    TREE_RETURN_INT: {
        python: (userCodeStub, funcName) => `
import json
from collections import deque

# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# User's function definition
${userCodeStub}
    # --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
    pass

# --- HELPER FUNCTIONS ---
def stringToTree(input):
    if not input or input == "[]":
        return None
    
    parts = input[1:-1].split(',')
    if not parts[0] or parts[0] == "null":
        return None
        
    root = TreeNode(int(parts[0]))
    queue = deque([root])
    i = 1
    while queue and i < len(parts):
        node = queue.popleft()
        
        if parts[i] and parts[i].strip() != "null":
            node.left = TreeNode(int(parts[i]))
            queue.append(node.left)
        i += 1
        
        if i < len(parts) and parts[i] and parts[i].strip() != "null":
            node.right = TreeNode(int(parts[i]))
            queue.append(node.right)
        i += 1
    return root

# --- TEST HARNESS ---
if __name__ == "__main__":
    line = input()
    root = stringToTree(line)
    result = ${funcName}(root)
    print(result)
`,
        java: (userCodeStub, funcName) => `
import java.util.*;
import java.io.*;

// Definition for a binary tree node.
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int x) { val = x; }
}

public class Main {
    // User's function definition
    ${userCodeStub}
        // --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
        throw new UnsupportedOperationException("Not implemented yet");
    }

    // --- HELPER FUNCTIONS ---
    public static TreeNode stringToTree(String input) {
        if (input == null || input.equals("[]")) return null;
        input = input.substring(1, input.length() - 1);
        String[] parts = input.split(",");
        if (parts.length == 0 || parts[0].equals("null")) return null;

        TreeNode root = new TreeNode(Integer.parseInt(parts[0].trim()));
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        int i = 1;
        while (!queue.isEmpty() && i < parts.length) {
            TreeNode node = queue.poll();
            
            if (i < parts.length && !parts[i].trim().equals("null")) {
                node.left = new TreeNode(Integer.parseInt(parts[i].trim()));
                queue.add(node.left);
            }
            i++;
            
            if (i < parts.length && !parts[i].trim().equals("null")) {
                node.right = new TreeNode(Integer.parseInt(parts[i].trim()));
                queue.add(node.right);
            }
            i++;
        }
        return root;
    }

    // --- TEST HARNESS ---
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.nextLine();
        TreeNode root = stringToTree(line);
        Main solution = new Main();
        int result = solution.${funcName}(root);
        System.out.println(result);
        sc.close();
    }
}
`,
    },

    // --- Signature 7: [4,2,7,1,3,6,9] -> [4,7,2,9,6,3,1] ---
    TREE_RETURN_TREE: {
        python: (userCodeStub, funcName) => `
import json
from collections import deque

# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# User's function definition
${userCodeStub}
    # --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
    pass

# --- HELPER FUNCTIONS ---
def stringToTree(input):
    if not input or input == "[]": return None
    parts = input[1:-1].split(',')
    if not parts[0] or parts[0] == "null": return None
    root = TreeNode(int(parts[0]))
    queue = deque([root])
    i = 1
    while queue and i < len(parts):
        node = queue.popleft()
        if i < len(parts) and parts[i] and parts[i].strip() != "null":
            node.left = TreeNode(int(parts[i]))
            queue.append(node.left)
        i += 1
        if i < len(parts) and parts[i] and parts[i].strip() != "null":
            node.right = TreeNode(int(parts[i]))
            queue.append(node.right)
        i += 1
    return root

def treeToString(root):
    if not root: return "[]"
    output = []
    queue = deque([root])
    while queue:
        node = queue.popleft()
        if node:
            output.append(str(node.val))
            queue.append(node.left)
            queue.append(node.right)
        else:
            output.append("null")
    # Trim trailing nulls
    while output and output[-1] == "null":
        output.pop()
    return "[" + ",".join(output) + "]"

# --- TEST HARNESS ---
if __name__ == "__main__":
    line = input()
    root = stringToTree(line)
    result_root = ${funcName}(root)
    print(treeToString(result_root))
`,
        java: (userCodeStub, funcName) => `
import java.util.*;
import java.io.*;

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode(int x) { val = x; }
}

public class Main {
    // User's function definition
    ${userCodeStub}
        // --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
        throw new UnsupportedOperationException("Not implemented yet");
    }

    // --- HELPER FUNCTIONS ---
    public static TreeNode stringToTree(String input) {
        if (input == null || input.equals("[]")) return null;
        input = input.substring(1, input.length() - 1);
        String[] parts = input.split(",");
        if (parts.length == 0 || parts[0].equals("null")) return null;
        TreeNode root = new TreeNode(Integer.parseInt(parts[0].trim()));
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        int i = 1;
        while (!queue.isEmpty() && i < parts.length) {
            TreeNode node = queue.poll();
            if (i < parts.length && !parts[i].trim().equals("null")) {
                node.left = new TreeNode(Integer.parseInt(parts[i].trim()));
                queue.add(node.left);
            }
            i++;
            if (i < parts.length && !parts[i].trim().equals("null")) {
                node.right = new TreeNode(Integer.parseInt(parts[i].trim()));
                queue.add(node.right);
            }
            i++;
        }
        return root;
    }

    public static String treeToString(TreeNode root) {
        if (root == null) return "[]";
        List<String> output = new ArrayList<>();
        Queue<TreeNode> queue = new LinkedList<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            TreeNode node = queue.poll();
            if (node != null) {
                output.add(String.valueOf(node.val));
                queue.add(node.left);
                queue.add(node.right);
            } else {
                output.add("null");
            }
        }
        // Trim trailing nulls
        while (output.size() > 0 && output.get(output.size() - 1).equals("null")) {
            output.remove(output.size() - 1);
        }
        return "[" + String.join(",", output) + "]";
    }

    // --- TEST HARNESS ---
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.nextLine();
        TreeNode root = stringToTree(line);
        Main solution = new Main();
        TreeNode resultRoot = solution.${funcName}(root);
        System.out.println(treeToString(resultRoot));
        sc.close();
    }
}
`,
    },

    // --- Signature 8: 3 -> 3 ---
    INT_RETURN_INT: {
        python: (userCodeStub, funcName) => `
# User's function definition
${userCodeStub}
    # --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
    pass

# --- TEST HARNESS ---
if __name__ == "__main__":
    n = int(input())
    result = ${funcName}(n)
    print(result)
`,
        java: (userCodeStub, funcName) => `
import java.util.*;
import java.io.*;

public class Main {
    // User's function definition
    ${userCodeStub}
        // --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
        throw new UnsupportedOperationException("Not implemented yet");
    }

    // --- TEST HARNESS ---
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        Main solution = new Main();
        int result = solution.${funcName}(n);
        System.out.println(result);
        sc.close();
    }
}
`,
    },
    // --- Signature 9: [1,2,3,1] -> true ---
  ARRAY_INT_RETURN_BOOLEAN: {
    python: (userCodeStub, funcName) => `
import json
# User's function definition
${userCodeStub}
    # --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
    pass

# --- TEST HARNESS ---
if __name__ == "__main__":
    array_line = input()
    nums = json.loads(array_line)
    result = ${funcName}(nums)
    print(str(result).lower()) # "true" or "false"
`,
    java: (userCodeStub, funcName) => `
import java.util.*;
import java.io.*;

public class Main {
    // User's function definition
    ${userCodeStub}
        // --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
        throw new UnsupportedOperationException("Not implemented yet");
    }

    // --- TEST HARNESS ---
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String arrayLine = sc.nextLine();
        
        int[] nums;
        arrayLine = arrayLine.substring(1, arrayLine.length() - 1);
        if (arrayLine.isEmpty()) {
            nums = new int[0];
        } else {
            nums = Arrays.stream(arrayLine.split(","))
                           .map(String::trim)
                           .mapToInt(Integer::parseInt)
                           .toArray();
        }
        
        Main solution = new Main();
        boolean result = solution.${funcName}(nums);
        System.out.println(result);
        sc.close();
    }
}
`,
  },
};
// --- END OF HARNESS TEMPLATES ---


/**
 * Generates the full, runnable scaffold code for the editor.
 * (This function is unchanged from our previous step)
 */
export const generateFullScaffold = (language, signature, funcTemplate, funcName) => {
    const lang = language.toLowerCase();

    // Find the harness for this signature
    const harnessBuilder = HARNESS_TEMPLATES[signature]?.[lang];

    if (harnessBuilder) {
        // Build the full code by passing the user's function template
        // and the function name into the harness builder
        return harnessBuilder(funcTemplate, funcName);
    }

    // --- THIS IS THE FIX ---
    // Fallback if we don't have a harness for this signature
    // The backslash '\' before the backtick '`' was removed.
    return `// Error: No harness found for signature "${signature}" in language "${lang}".\n// Please ask the admin to create one.\n\n${funcTemplate}\n  // Write your code here\n}`;
};