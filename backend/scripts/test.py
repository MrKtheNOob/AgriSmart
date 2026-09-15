import json
import sys

def stretch_json(input_file, output_file=None, max_line_width=100):
    """
    Reformat JSON file with nested objects on single lines for better readability.
    
    Args:
        input_file: Path to input JSON file
        output_file: Path to output JSON file (if None, prints to stdout)
        max_line_width: Maximum line width (approximate, used for formatting)
    """
    
    # Load the JSON data
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Custom JSON encoder that formats objects on single lines
    def format_json(obj, indent=0, first_indent=True):
        if isinstance(obj, dict):
            # For dictionaries, put everything on one line if small enough
            items = []
            for key, value in obj.items():
                # Format the value
                if isinstance(value, (dict, list)):
                    formatted_value = format_json(value, indent + len(key) + 4, False)
                elif isinstance(value, str):
                    # Escape quotes and special characters
                    formatted_value = json.dumps(value, ensure_ascii=False)
                else:
                    formatted_value = json.dumps(value, ensure_ascii=False)
                items.append(f'"{key}": {formatted_value}')
            
            # Join items with a space after colon and comma
            result = '{ ' + ', '.join(items) + ' }'
            return result
            
        elif isinstance(obj, list):
            # For lists, check if all items are simple or if they need multi-line
            if all(not isinstance(item, (dict, list)) for item in obj):
                # Simple list - one line
                items = [json.dumps(item, ensure_ascii=False) if isinstance(item, str) 
                        else json.dumps(item) for item in obj]
                return '[' + ', '.join(items) + ']'
            else:
                # Complex list - format each item
                items = []
                for item in obj:
                    items.append(format_json(item, indent + 2, False))
                # Join with commas and spaces
                return '[' + ', '.join(items) + ']'
        else:
            return json.dumps(obj, ensure_ascii=False)
    
    # Format the entire data structure
    if isinstance(data, list):
        # For lists of objects
        formatted_items = []
        for item in data:
            formatted_items.append(format_json(item, 0, True))
        result = '[\n  ' + ',\n  '.join(formatted_items) + '\n]'
    else:
        result = format_json(data, 0, True)
    
    # Write to output file or stdout
    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(result)
        print(f"✅ Successfully stretched JSON to {output_file}")
    else:
        print(result)

def main():
    # Check command line arguments
    
    
    input_file = "../data/processed/crops_merged.json"
    output_file = "../data/processed/crops_merged.json"
    
    try:
        stretch_json(input_file, output_file)
    except FileNotFoundError:
        print(f"❌ Error: File '{input_file}' not found.")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON format - {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()