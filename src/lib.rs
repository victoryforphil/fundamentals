pub fn test_template_function() {
    println!("Hello from victory-template!");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_test_template_function() {
        test_template_function();
    }
}
