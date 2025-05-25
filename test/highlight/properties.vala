class Program : Object
{
    int some_int {
        public get {
            return 1;
        }
        set {
            (int) value;
        }
    }
    
    bool is_true { get; set; }
}
