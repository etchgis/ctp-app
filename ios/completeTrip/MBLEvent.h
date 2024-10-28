#import <React/RCTComponent.h>
#import <Foundation/Foundation.h>
#import "MBLEventProtocol.h"

@interface MBLEvent : NSObject<MBLEventProtocol>

@property (nonatomic, copy) NSString *type;
@property (nonatomic, strong) NSDictionary *payload;
@property (nonatomic, readonly) NSTimeInterval timestamp;

+ (MBLEvent*)makeEvent:(NSString*)eventType;
+ (MBLEvent*)makeEvent:(NSString*)eventType withPayload:(NSDictionary*)payload;

@end
