// This file builds the complete, runnable code by combining
// a problem's specific function with a generic "harness"
// based on its input/output signature.

// --- HARNESS TEMPLATES ---
const HARNESS_TEMPLATES = {

    // ============================================================
    // 1. ARRAY_INT_TARGET_INT
    // Input: [2,7,11,15]\n9
    // Output: [0,1]
    // ============================================================
    ARRAY_INT_TARGET_INT: {
        python: (userCodeStub, funcName) => `
import json
# User's function definition
${userCodeStub}
    # --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
    pass

# --- TEST HARNESS ---
if __name__ == "__main__":
    try:
        array_line = input()
        target_line = input()
        if not array_line or not target_line: exit()
        target = int(target_line.strip())
        nums = json.loads(array_line)
        result = ${funcName}(nums, target)
        if result and len(result) == 2:
            print(f"[{result[0]}, {result[1]}]")
        else:
            print("[]")
    except Exception as e:
        print(f"Error: {e}")
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
        if (!sc.hasNextLine()) return;
        String arrayLine = sc.nextLine();
        if (!sc.hasNextLine()) return;
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
        } else {
            System.out.println("[]");
        }
        sc.close();
    }
}
`,
        javascript: (userCodeStub, funcName) => `
const fs = require('fs');

// User's function definition
${userCodeStub}

// --- TEST HARNESS ---
try {
    const input = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (input.length >= 2) {
        const nums = JSON.parse(input[0]);
        const target = parseInt(input[1]);
        const result = ${funcName}(nums, target);
        console.log(JSON.stringify(result));
    }
} catch (e) {
    console.error(e);
}
`,
        "c++": (userCodeStub, funcName) => `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

using namespace std;

// Helper to parse array like "[1,2,3]"
vector<int> parseArray(string s) {
    vector<int> res;
    if (s.length() < 2) return res;
    s = s.substr(1, s.length() - 2); // remove []
    stringstream ss(s);
    string item;
    while (getline(ss, item, ',')) {
        res.push_back(stoi(item));
    }
    return res;
}

// --- SOLUTION CLASS ---
class Solution {
public:
    // User's function definition
    ${userCodeStub}
        // --- WRITE YOUR ALGORITHM IN THE FUNCTION ABOVE ---
        return {}; // Placeholder return
    } 
};

// --- TEST HARNESS ---
int main() {
    string line1, line2;
    getline(cin, line1);
    getline(cin, line2);
    if (line1.empty() || line2.empty()) return 0;
    
    vector<int> nums = parseArray(line1);
    int target = stoi(line2);
    
    Solution sol;
    vector<int> result = sol.${funcName}(nums, target);
    
    cout << "[" << result[0] << "," << result[1] << "]" << endl;
    return 0;
}
`
    },

    // ============================================================
    // 2. STRING_RETURN_BOOLEAN
    // Input: "racecar"
    // Output: true
    // ============================================================
    STRING_RETURN_BOOLEAN: {
        python: (userCodeStub, funcName) => `
# User's function definition
${userCodeStub}
    pass

# --- TEST HARNESS ---
if __name__ == "__main__":
    try:
        s = input()
        result = ${funcName}(s)
        print(str(result).lower())
    except: pass
`,
        java: (userCodeStub, funcName) => `
import java.util.*;
import java.io.*;

public class Main {
    ${userCodeStub}
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if(sc.hasNextLine()) {
            String s = sc.nextLine();
            Main solution = new Main();
            boolean result = solution.${funcName}(s);
            System.out.println(result);
        }
        sc.close();
    }
}
`,
        javascript: (userCodeStub, funcName) => `
const fs = require('fs');

// User's function definition
${userCodeStub}

// --- TEST HARNESS ---
try {
    const input = fs.readFileSync(0, 'utf-8').trim();
    const result = ${funcName}(input);
    console.log(result.toString().toLowerCase());
} catch (e) {}
`,
        "c++": (userCodeStub, funcName) => `
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

// --- SOLUTION CLASS ---
class Solution {
public:
    // User's function definition
    ${userCodeStub}
        return false; // Placeholder return
    }
};

// --- TEST HARNESS ---
int main() {
    string s;
    getline(cin, s);
    Solution sol;
    bool result = sol.${funcName}(s);
    cout << (result ? "true" : "false") << endl;
    return 0;
}
`
    },

    // ============================================================
    // 3. ARRAY_INT_RETURN_INT
    // Input: [-2,1,-3,4]
    // Output: 6
    // ============================================================
    ARRAY_INT_RETURN_INT: {
        python: (userCodeStub, funcName) => `
import json
${userCodeStub}
    pass

if __name__ == "__main__":
    try:
        array_line = input()
        nums = json.loads(array_line)
        result = ${funcName}(nums)
        print(result)
    except: pass
`,
        java: (userCodeStub, funcName) => `
import java.util.*;
import java.io.*;

public class Main {
    ${userCodeStub}
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if(!sc.hasNextLine()) return;
        String arrayLine = sc.nextLine();
        arrayLine = arrayLine.substring(1, arrayLine.length() - 1);
        int[] nums;
        if (arrayLine.isEmpty()) {
            nums = new int[0];
        } else {
            nums = Arrays.stream(arrayLine.split(","))
                           .map(String::trim)
                           .mapToInt(Integer::parseInt)
                           .toArray();
        }
        
        Main solution = new Main();
        int result = solution.${funcName}(nums);
        System.out.println(result);
        sc.close();
    }
}
`,
        javascript: (userCodeStub, funcName) => `
const fs = require('fs');
${userCodeStub}

try {
    const input = fs.readFileSync(0, 'utf-8').trim();
    const nums = JSON.parse(input);
    const result = ${funcName}(nums);
    console.log(result);
} catch(e) {}
`,
        "c++": (userCodeStub, funcName) => `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

using namespace std;

vector<int> parseArray(string s) {
    vector<int> res;
    if(s.length() < 2) return res;
    s = s.substr(1, s.length() - 2);
    stringstream ss(s);
    string item;
    while (getline(ss, item, ',')) {
        res.push_back(stoi(item));
    }
    return res;
}

// --- SOLUTION CLASS ---
class Solution {
public:
    ${userCodeStub}
        return 0; // Placeholder
    }
};

int main() {
    string line;
    getline(cin, line);
    vector<int> nums = parseArray(line);
    Solution sol;
    cout << sol.${funcName}(nums) << endl;
    return 0;
}
`
    },

    // ============================================================
    // 4. LINKED_LIST_RETURN_LINKED_LIST
    // Input: [1,2,3]
    // Output: [3,2,1]
    // ============================================================
    LINKED_LIST_RETURN_LINKED_LIST: {
        python: (userCodeStub, funcName) => `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

${userCodeStub}
    pass

def stringToLinkedList(input):
    if not input or input == "[]": return None
    parts = input[1:-1].split(',')
    if not parts or parts[0] == "": return None
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

if __name__ == "__main__":
    line = input()
    head = stringToLinkedList(line)
    result_head = ${funcName}(head)
    print(linkedListToString(result_head))
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
    ${userCodeStub}
        return null;
    }

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

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if(!sc.hasNextLine()) return;
        String line = sc.nextLine();
        ListNode head = stringToLinkedList(line);
        Main solution = new Main();
        ListNode result = solution.${funcName}(head);
        System.out.println(linkedListToString(result));
        sc.close();
    }
}
`,
        javascript: (userCodeStub, funcName) => `
const fs = require('fs');

function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val)
    this.next = (next===undefined ? null : next)
}

${userCodeStub}

function stringToLinkedList(input) {
    if (!input || input === "[]") return null;
    const parts = input.slice(1, -1).split(',');
    if (parts.length === 0 || parts[0] === "") return null;
    let head = new ListNode(parseInt(parts[0]));
    let current = head;
    for (let i = 1; i < parts.length; i++) {
        current.next = new ListNode(parseInt(parts[i]));
        current = current.next;
    }
    return head;
}

function linkedListToString(head) {
    if (!head) return "[]";
    let parts = [];
    let current = head;
    while (current) {
        parts.push(current.val);
        current = current.next;
    }
    return "[" + parts.join(",") + "]";
}

try {
    const input = fs.readFileSync(0, 'utf-8').trim();
    const head = stringToLinkedList(input);
    const result = ${funcName}(head);
    console.log(linkedListToString(result));
} catch(e) {}
`,
        "c++": (userCodeStub, funcName) => `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>

using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

// --- SOLUTION CLASS ---
class Solution {
public:
    ${userCodeStub}
        return nullptr; // Placeholder
    }
};

ListNode* stringToLinkedList(string input) {
    if (input == "[]" || input.size() < 2) return nullptr;
    input = input.substr(1, input.length() - 2);
    stringstream ss(input);
    string item;
    if (!getline(ss, item, ',')) return nullptr;
    ListNode* head = new ListNode(stoi(item));
    ListNode* current = head;
    while (getline(ss, item, ',')) {
        current->next = new ListNode(stoi(item));
        current = current->next;
    }
    return head;
}

string linkedListToString(ListNode* head) {
    if (!head) return "[]";
    string res = "[";
    ListNode* curr = head;
    while (curr) {
        res += to_string(curr->val);
        if (curr->next) res += ",";
        curr = curr->next;
    }
    res += "]";
    return res;
}

int main() {
    string line;
    getline(cin, line);
    ListNode* head = stringToLinkedList(line);
    Solution sol;
    ListNode* res = sol.${funcName}(head);
    cout << linkedListToString(res) << endl;
    return 0;
}
`
    },

    // ============================================================
    // 5. LINKED_LIST_RETURN_BOOLEAN
    // Input: [1,2,3,4]\n1
    // Output: true
    // ============================================================
    LINKED_LIST_RETURN_BOOLEAN: {
        python: (userCodeStub, funcName) => `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

${userCodeStub}
    pass

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
            
    if cycleNode: current.next = cycleNode
    return head

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
    ${userCodeStub}
        return false;
    }

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
        if (cycleNode != null) current.next = cycleNode;
        return head;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if(!sc.hasNextLine()) return;
        String line = sc.nextLine();
        String posLine = sc.nextLine();
        int pos = Integer.parseInt(posLine);
        ListNode head = stringToLinkedList(line, pos);
        Main solution = new Main();
        System.out.println(solution.${funcName}(head));
        sc.close();
    }
}
`,
        javascript: (userCodeStub, funcName) => `
const fs = require('fs');

function ListNode(val) {
    this.val = val;
    this.next = null;
}

${userCodeStub}

function stringToLinkedList(input, pos) {
    if (!input || input === "[]") return null;
    const parts = input.slice(1, -1).split(',');
    if (parts.length === 0 || parts[0] === "") return null;
    let head = new ListNode(parseInt(parts[0]));
    let current = head;
    let cycleNode = null;
    if (pos === 0) cycleNode = head;

    for (let i = 1; i < parts.length; i++) {
        current.next = new ListNode(parseInt(parts[i]));
        current = current.next;
        if (i === pos) cycleNode = current;
    }
    if (cycleNode) current.next = cycleNode;
    return head;
}

try {
    const lines = fs.readFileSync(0, 'utf-8').trim().split('\\n');
    if (lines.length >= 2) {
        const head = stringToLinkedList(lines[0].trim(), parseInt(lines[1].trim()));
        const result = ${funcName}(head);
        console.log(result.toString().toLowerCase());
    }
} catch(e) {}
`,
        "c++": (userCodeStub, funcName) => `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>

using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode(int x) : val(x), next(NULL) {}
};

// --- SOLUTION CLASS ---
class Solution {
public:
    ${userCodeStub}
        return false; // Placeholder
    }
};

ListNode* stringToLinkedList(string input, int pos) {
    if (input == "[]" || input.size() < 2) return nullptr;
    input = input.substr(1, input.length() - 2);
    stringstream ss(input);
    string item;
    if (!getline(ss, item, ',')) return nullptr;
    ListNode* head = new ListNode(stoi(item));
    ListNode* current = head;
    ListNode* cycleNode = nullptr;
    if (pos == 0) cycleNode = head;
    
    int i = 1;
    while (getline(ss, item, ',')) {
        current->next = new ListNode(stoi(item));
        current = current->next;
        if (i == pos) cycleNode = current;
        i++;
    }
    if (cycleNode) current->next = cycleNode;
    return head;
}

int main() {
    string line1, line2;
    getline(cin, line1);
    getline(cin, line2);
    int pos = stoi(line2);
    ListNode* head = stringToLinkedList(line1, pos);
    Solution sol;
    cout << (sol.${funcName}(head) ? "true" : "false") << endl;
    return 0;
}
`
    },

    // ============================================================
    // 6. TREE_RETURN_INT
    // Input: [3,9,20,null,null,15,7]
    // Output: 3
    // ============================================================
    TREE_RETURN_INT: {
        python: (userCodeStub, funcName) => `
import json
from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

${userCodeStub}
    pass

def stringToTree(input):
    if not input or input == "[]": return None
    parts = input[1:-1].split(',')
    if not parts[0] or parts[0] == "null": return None
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

if __name__ == "__main__":
    line = input()
    root = stringToTree(line)
    result = ${funcName}(root)
    print(result)
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
    ${userCodeStub}
        return 0;
    }

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

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if(!sc.hasNextLine()) return;
        String line = sc.nextLine();
        TreeNode root = stringToTree(line);
        Main solution = new Main();
        System.out.println(solution.${funcName}(root));
        sc.close();
    }
}
`,
        javascript: (userCodeStub, funcName) => `
const fs = require('fs');

function TreeNode(val, left, right) {
    this.val = (val===undefined ? 0 : val)
    this.left = (left===undefined ? null : left)
    this.right = (right===undefined ? null : right)
}

${userCodeStub}

function stringToTree(input) {
    if (!input || input === "[]") return null;
    const parts = input.slice(1, -1).split(',');
    if (parts.length === 0 || parts[0] === "null") return null;
    
    const root = new TreeNode(parseInt(parts[0]));
    const queue = [root];
    let i = 1;
    
    while (queue.length > 0 && i < parts.length) {
        const node = queue.shift();
        
        if (i < parts.length && parts[i].trim() !== "null") {
            node.left = new TreeNode(parseInt(parts[i]));
            queue.push(node.left);
        }
        i++;
        
        if (i < parts.length && parts[i].trim() !== "null") {
            node.right = new TreeNode(parseInt(parts[i]));
            queue.push(node.right);
        }
        i++;
    }
    return root;
}

try {
    const input = fs.readFileSync(0, 'utf-8').trim();
    const root = stringToTree(input);
    const result = ${funcName}(root);
    console.log(result);
} catch(e){}
`,
        "c++": (userCodeStub, funcName) => `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <queue>

using namespace std;

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

// --- SOLUTION CLASS ---
class Solution {
public:
    ${userCodeStub}
        return 0; // Placeholder
    }
};

TreeNode* stringToTree(string input) {
    if (input == "[]" || input.size() < 2) return nullptr;
    input = input.substr(1, input.length() - 2);
    stringstream ss(input);
    string item;
    if (!getline(ss, item, ',') || item == "null") return nullptr;
    
    TreeNode* root = new TreeNode(stoi(item));
    queue<TreeNode*> q;
    q.push(root);
    
    while (!q.empty() && getline(ss, item, ',')) {
        TreeNode* node = q.front();
        q.pop();
        
        if (item != "null") {
            node->left = new TreeNode(stoi(item));
            q.push(node->left);
        }
        
        if (getline(ss, item, ',')) {
            if (item != "null") {
                node->right = new TreeNode(stoi(item));
                q.push(node->right);
            }
        }
    }
    return root;
}

int main() {
    string line;
    getline(cin, line);
    TreeNode* root = stringToTree(line);
    Solution sol;
    cout << sol.${funcName}(root) << endl;
    return 0;
}
`
    },

    // ============================================================
    // 7. TREE_RETURN_TREE
    // Input: [4,2,7]
    // Output: [4,7,2]
    // ============================================================
    TREE_RETURN_TREE: {
        python: (userCodeStub, funcName) => `
import json
from collections import deque

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

${userCodeStub}
    pass

def stringToTree(input):
    if not input or input == "[]": return None
    parts = input[1:-1].split(',')
    if not parts[0] or parts[0] == "null": return None
    root = TreeNode(int(parts[0]))
    queue = deque([root])
    i = 1
    while queue and i < len(parts):
        node = queue.popleft()
        if i < len(parts) and parts[i].strip() != "null":
            node.left = TreeNode(int(parts[i]))
            queue.append(node.left)
        i += 1
        if i < len(parts) and parts[i].strip() != "null":
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
    while output and output[-1] == "null":
        output.pop()
    return "[" + ",".join(output) + "]"

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
    ${userCodeStub}
        return null;
    }

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
        while (output.size() > 0 && output.get(output.size() - 1).equals("null")) {
            output.remove(output.size() - 1);
        }
        return "[" + String.join(",", output) + "]";
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if(!sc.hasNextLine()) return;
        String line = sc.nextLine();
        TreeNode root = stringToTree(line);
        Main solution = new Main();
        TreeNode result = solution.${funcName}(root);
        System.out.println(treeToString(result));
        sc.close();
    }
}
`,
        javascript: (userCodeStub, funcName) => `
const fs = require('fs');

function TreeNode(val, left, right) {
    this.val = (val===undefined ? 0 : val)
    this.left = (left===undefined ? null : left)
    this.right = (right===undefined ? null : right)
}

${userCodeStub}

function stringToTree(input) {
    if (!input || input === "[]") return null;
    const parts = input.slice(1, -1).split(',');
    if (parts.length === 0 || parts[0] === "null") return null;
    
    const root = new TreeNode(parseInt(parts[0]));
    const queue = [root];
    let i = 1;
    
    while (queue.length > 0 && i < parts.length) {
        const node = queue.shift();
        if (i < parts.length && parts[i].trim() !== "null") {
            node.left = new TreeNode(parseInt(parts[i]));
            queue.push(node.left);
        }
        i++;
        if (i < parts.length && parts[i].trim() !== "null") {
            node.right = new TreeNode(parseInt(parts[i]));
            queue.push(node.right);
        }
        i++;
    }
    return root;
}

function treeToString(root) {
    if (!root) return "[]";
    const output = [];
    const queue = [root];
    while (queue.length > 0) {
        const node = queue.shift();
        if (node) {
            output.push(node.val);
            queue.push(node.left);
            queue.push(node.right);
        } else {
            output.push("null");
        }
    }
    // trim trailing nulls
    while (output.length > 0 && output[output.length - 1] === "null") {
        output.pop();
    }
    return "[" + output.join(",") + "]";
}

try {
    const input = fs.readFileSync(0, 'utf-8').trim();
    const root = stringToTree(input);
    const result = ${funcName}(root);
    console.log(treeToString(result));
} catch(e){}
`,
       "c++": (userCodeStub, funcName) => `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <queue>

using namespace std;

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

// --- SOLUTION CLASS ---
class Solution {
public:
    ${userCodeStub}
        return nullptr; // Placeholder
    }
};

TreeNode* stringToTree(string input) {
    // ... (Same stringToTree logic as above) ...
    if (input == "[]" || input.size() < 2) return nullptr;
    input = input.substr(1, input.length() - 2);
    stringstream ss(input);
    string item;
    if (!getline(ss, item, ',') || item == "null") return nullptr;
    
    TreeNode* root = new TreeNode(stoi(item));
    queue<TreeNode*> q;
    q.push(root);
    
    while (!q.empty() && getline(ss, item, ',')) {
        TreeNode* node = q.front();
        q.pop();
        if (item != "null") {
            node->left = new TreeNode(stoi(item));
            q.push(node->left);
        }
        if (getline(ss, item, ',')) {
            if (item != "null") {
                node->right = new TreeNode(stoi(item));
                q.push(node->right);
            }
        }
    }
    return root;
}

string treeToString(TreeNode* root) {
    if (!root) return "[]";
    string res = "[";
    vector<string> vals;
    queue<TreeNode*> q;
    q.push(root);
    
    while(!q.empty()) {
        TreeNode* node = q.front();
        q.pop();
        if(node) {
            vals.push_back(to_string(node->val));
            q.push(node->left);
            q.push(node->right);
        } else {
            vals.push_back("null");
        }
    }
    // Trim trailing nulls
    while (!vals.empty() && vals.back() == "null") {
        vals.pop_back();
    }
    for (int i = 0; i < vals.size(); ++i) {
        res += vals[i];
        if (i < vals.size() - 1) res += ",";
    }
    res += "]";
    return res;
}

int main() {
    string line;
    getline(cin, line);
    TreeNode* root = stringToTree(line);
    Solution sol;
    TreeNode* res = sol.${funcName}(root);
    cout << treeToString(res) << endl;
    return 0;
}
`
    },

    // ============================================================
    // 8. INT_RETURN_INT
    // Input: 3
    // Output: 3
    // ============================================================
    INT_RETURN_INT: {
        python: (userCodeStub, funcName) => `
${userCodeStub}
    pass

if __name__ == "__main__":
    try:
        line = input()
        if line:
            n = int(line.strip())
            result = ${funcName}(n)
            print(result)
    except: pass
`,
        java: (userCodeStub, funcName) => `
import java.util.*;
import java.io.*;

public class Main {
    ${userCodeStub}
        return 0;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if(sc.hasNextInt()){
            int n = sc.nextInt();
            Main solution = new Main();
            System.out.println(solution.${funcName}(n));
        }
        sc.close();
    }
}
`,
        javascript: (userCodeStub, funcName) => `
const fs = require('fs');
${userCodeStub}

try {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if(input) {
        const n = parseInt(input);
        console.log(${funcName}(n));
    }
} catch(e){}
`,
        "c++": (userCodeStub, funcName) => `
#include <iostream>
using namespace std;

// --- SOLUTION CLASS ---
class Solution {
public:
    ${userCodeStub}
        return 0;
    }
};

int main() {
    int n;
    if (cin >> n) {
        Solution sol;
        cout << sol.${funcName}(n) << endl;
    }
    return 0;
}
`
    },

    // ============================================================
    // 9. ARRAY_INT_RETURN_BOOLEAN
    // Input: [1,2,3,1]
    // Output: true
    // ============================================================
    ARRAY_INT_RETURN_BOOLEAN: {
        python: (userCodeStub, funcName) => `
import json
${userCodeStub}
    pass

if __name__ == "__main__":
    try:
        array_line = input()
        nums = json.loads(array_line)
        result = ${funcName}(nums)
        print(str(result).lower())
    except: pass
`,
        java: (userCodeStub, funcName) => `
import java.util.*;
import java.io.*;

public class Main {
    ${userCodeStub}
        return false;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if(!sc.hasNextLine()) return;
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
        javascript: (userCodeStub, funcName) => `
const fs = require('fs');

${userCodeStub}

try {
    const input = fs.readFileSync(0, 'utf-8').trim();
    const nums = JSON.parse(input);
    const result = ${funcName}(nums);
    console.log(result.toString().toLowerCase());
} catch(e){}
`,
        "c++": (userCodeStub, funcName) => `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>

using namespace std;

vector<int> parseArray(string s) {
    vector<int> res;
    if (s.length() < 2) return res;
    s = s.substr(1, s.length() - 2);
    stringstream ss(s);
    string item;
    while (getline(ss, item, ',')) {
        res.push_back(stoi(item));
    }
    return res;
}

// --- SOLUTION CLASS ---
class Solution {
public:
    ${userCodeStub}
        return false;
    }
};

int main() {
    string line;
    getline(cin, line);
    vector<int> nums = parseArray(line);
    Solution sol;
    cout << (sol.${funcName}(nums) ? "true" : "false") << endl;
    return 0;
}
`
    },
};

// --- GENERATOR FUNCTION ---
export const generateFullScaffold = (language, signature, funcTemplate, funcName) => {
    let langKey = language.toLowerCase();
    // Normalize C++ key
    if (langKey === 'c++' || langKey === 'cpp') langKey = 'c++';

    const harnessBuilder = HARNESS_TEMPLATES[signature]?.[langKey];

    if (harnessBuilder) {
        return harnessBuilder(funcTemplate, funcName);
    }

    return `// Error: No harness found for signature "${signature}" in language "${language}".\n// Please ask the admin to add it to scaffoldHelper.js.\n\n${funcTemplate}\n`;
};