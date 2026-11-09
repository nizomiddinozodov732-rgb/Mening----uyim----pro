from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions

class ConstructionCalculatorView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        size = request.data.get('size')  # size in sq meters
        floors = request.data.get('floors', 1)
        material_quality = request.data.get('material_quality', 'standard')  # economy, standard, premium
        rooms = request.data.get('rooms', 3)
        calc_type = request.data.get('calc_type', 'construction') # construction or renovation

        try:
            size = float(size)
            floors = int(floors)
            rooms = int(rooms)
        except (TypeError, ValueError):
            return Response({'error': 'Noto\'g\'ri ma\'lumotlar kiritildi!'}, status=400)

        # Base rate per sq meter (in Uzbek sums)
        if calc_type == 'construction':
            base_rate = 3500000  # 3.5M UZS per sq meter base
        else:
            base_rate = 1500000  # 1.5M UZS per sq meter base for renovation

        # Quality multiplier
        quality_multipliers = {
            'economy': 0.8,
            'standard': 1.0,
            'premium': 1.5
        }
        multiplier = quality_multipliers.get(material_quality, 1.0)

        # Floors multiplier
        floor_multiplier = 1.0 + (floors - 1) * 0.15 # each additional floor adds 15% complexity

        # Rooms multiplier
        room_multiplier = 1.0 + (rooms * 0.02) # each room adds 2% complexity/partition cost

        # Calculate totals
        estimated_cost_per_sqm = base_rate * multiplier * floor_multiplier * room_multiplier
        total_estimated_cost = estimated_cost_per_sqm * size

        # Detailed breakdown
        if calc_type == 'construction':
            breakdown = {
                'foundation': total_estimated_cost * 0.15,
                'walls_and_structure': total_estimated_cost * 0.35,
                'roofing': total_estimated_cost * 0.12,
                'finishing_works': total_estimated_cost * 0.20,
                'plumbing_electrical': total_estimated_cost * 0.13,
                'documentation_permit': total_estimated_cost * 0.05,
            }
        else:
            breakdown = {
                'demolition': total_estimated_cost * 0.10,
                'materials': total_estimated_cost * 0.45,
                'labor_cost': total_estimated_cost * 0.35,
                'cleanup_delivery': total_estimated_cost * 0.10,
            }

        return Response({
            'size': size,
            'floors': floors,
            'material_quality': material_quality,
            'rooms': rooms,
            'calc_type': calc_type,
            'estimated_cost_per_sqm': int(estimated_cost_per_sqm),
            'total_estimated_cost': int(total_estimated_cost),
            'breakdown': {k: int(v) for k, v in breakdown.items()}
        })
