#ifndef MapEventProtocol_h
#define MapEventProtocol_h

@protocol MBLEventProtocol <NSObject>

@property (nonatomic, copy) NSString *type;
@property (nonatomic, strong) NSDictionary *payload;

- (NSDictionary*)toJSON;

@end

#endif /* MapEventProtocol_h */
