import re

def main():
    file_path = "/src/components/provider/ProviderDashboard.tsx"
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find the start of the ops_center block
    start_marker = ") : activeSubTab === 'ops_center' ? ("
    start_idx = content.find(start_marker)
    if start_idx == -1:
        print("Error: Could not find start of ops_center block!")
        return

    # Find the start of the stats block which immediately follows ops_center
    end_marker = ") : activeSubTab === 'stats' || (providerSubscription?.includesAdvancedStats"
    end_idx = content.find(end_marker)
    if end_idx == -1:
        # Fallback search if there are slight character differences
        end_marker = "activeSubTab === 'stats'"
        end_idx = content.find(end_marker)
        if end_idx == -1:
            print("Error: Could not find start of stats block!")
            return
        # Adjust end_idx back to the start of the line or condition
        # find the preceding ')' or ')'
        pos = content.rfind(")", 0, end_idx)
        if pos != -1:
            end_idx = pos - 1

    print(f"Found ops_center block from index {start_idx} to {end_idx}")

    # Extract the full ops_center section to extract the supplier modals
    ops_block = content[start_idx:end_idx]

    # Find the View Supplier Modal
    view_modal_marker = "{/* View Supplier Modal */}"
    view_modal_idx = ops_block.find(view_modal_marker)
    
    # Find the Edit Supplier Modal
    edit_modal_marker = "{/* Edit Supplier Modal */}"
    edit_modal_idx = ops_block.find(edit_modal_marker)

    extracted_modals = ""
    if view_modal_idx != -1:
        # Extract from View Supplier Modal to the end of the block (which contains both modals)
        extracted_modals = ops_block[view_modal_idx:]
        # Remove trailing closing parens/tags that belong to the outer ops_center container
        # The block ends with a series of closing tags. Let's find the last ')' or '}'
        # or we can just extract the modals using the markers
        print("Found supplier modals in ops_center block. Extracting...")
        
        # Let's extract each modal precisely
        view_modal_str = ""
        edit_modal_str = ""
        
        # The view modal goes from view_modal_idx to edit_modal_idx
        if edit_modal_idx != -1:
            view_modal_str = ops_block[view_modal_idx:edit_modal_idx]
            # The edit modal goes from edit_modal_idx to the end of the divs (approx before the final </div> in ops_block)
            # Let's find where the edit modal ends. It ends before the final </div> of the activeSubTab === 'ops_center' block.
            # The edit modal ends with '            )}' around line 9507.
            last_modal_close = ops_block.rfind("            )}")
            if last_modal_close != -1:
                edit_modal_str = ops_block[edit_modal_idx:last_modal_close + 15] # include '            )}'
            else:
                edit_modal_str = ops_block[edit_modal_idx:]
        else:
            view_modal_str = ops_block[view_modal_idx:]
            
        extracted_modals = view_modal_str + "\n\n" + edit_modal_str

    # Prepare the new ops_center block
    new_ops_block = """) : activeSubTab === 'ops_center' ? (
          <OperationsCenter
            currentProviderName={currentProviderName}
            currentUserName={currentUserName}
            myBookings={myBookings}
            mySupportRequests={mySupportRequests}
            showNotification={showNotification}
          />
        """

    # Replace the old ops_center block with the new one
    updated_content = content[:start_idx] + new_ops_block + content[end_idx:]

    # Now let's insert the extracted modals at the end of the sub-tabs container
    # The sub-tabs container closes with "        )}\n      </div>" or similar before the last div
    # Let's locate the last occurrence of "        )}\n      </div>" or "        )}\n    </div>"
    close_marker_pattern = r"\s+\)\}\s+</div>\s+</div>\s+);\s+\}"
    match = list(re.finditer(close_marker_pattern, updated_content))
    if match:
        last_match = match[-1]
        insert_idx = last_match.start()
        # Insert modals right before the closing tags
        # Let's see: we want to insert them inside the main container <div>, so right before the outer closing </div>
        # The last_match is:
        #         )}
        #       </div>
        #     </div>
        #   );
        # }
        # We want to insert the modals inside the <div>, which is right after "        )}"
        close_marker = "        )}"
        sub_idx = updated_content.find(close_marker, last_match.start(), last_match.end())
        if sub_idx != -1:
            insert_pos = sub_idx + len(close_marker)
            updated_content = updated_content[:insert_pos] + "\n\n" + extracted_modals + updated_content[insert_pos:]
            print("Successfully inserted extracted modals before closing container.")
    else:
        # Fallback: find standard end of return block
        fallback_marker = "        )}\n      </div>"
        pos = updated_content.rfind(fallback_marker)
        if pos != -1:
            insert_pos = pos + len(fallback_marker)
            updated_content = updated_content[:insert_pos] + "\n\n" + extracted_modals + updated_content[insert_pos:]
            print("Successfully inserted modals at fallback position.")
        else:
            print("Warning: Could not insert modals automatically, appending at the very end of file before closing brace.")
            # Let's insert before the final '  );\n}'
            final_marker = "  );\n}"
            pos = updated_content.rfind(final_marker)
            if pos != -1:
                updated_content = updated_content[:pos] + "\n\n" + extracted_modals + updated_content[pos:]

    # Write the updated content back
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(updated_content)

    print("Success: ProviderDashboard.tsx updated successfully!")

if __name__ == "__main__":
    main()
