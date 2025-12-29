CREATE SEQUENCE product_code_seq               
START WITH 1000                                
INCREMENT BY 1;                                
                                               
SELECT sequence_name                           
FROM information_schema.sequences              
WHERE sequence_name = 'product_code_seq';      