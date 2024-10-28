#import "MBLEvent.h"

@implementation MBLEvent

- (instancetype)init
{
    if (self = [super init]) {
        _timestamp = [[NSDate date] timeIntervalSince1970];
    }
    return self;
}

- (NSDictionary*)payload
{
    if (_payload == nil) {
        return @{};
    }
    return _payload;
}

- (NSDictionary*)toJSON
{
    return @{ @"type": self.type, @"payload": self.payload };
}

+ (MBLEvent*)makeEvent:(NSString*)type
{
    return [MBLEvent makeEvent:type withPayload:@{}];
}

+ (MBLEvent*)makeEvent:(NSString*)type withPayload:(NSDictionary*)payload
{
    MBLEvent *event = [[MBLEvent alloc] init];
    event.type = type;
    event.payload = payload;
    return event;
}

@end
